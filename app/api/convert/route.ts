/* eslint-disable prefer-const */
/* 
This API is designed solely for personal use and is not intended for industrial or large-scale usage. 
It is a basic implementation without any significant optimizations. 
The hardware acceleration (GPU-based encoding) uses VAAPI and is specifically tailored to my local setup. 
It relies on the GPU available on my system and might not work with other systems due to differences 
in GPU drivers or hardware configurations. 

If VAAPI (GPU acceleration) is not available, the script automatically falls back to software encoding (CPU-based).
For general use, users must adapt the `ffmpeg` commands to suit their specific hardware setup.

DISCLAIMER:
- The script assumes a Linux environment with ffmpeg and VAAPI support installed.
- For systems without VAAPI, the user must ensure software encoding is working properly.
- The variable `enableSoftwareAcceleration` controls whether to skip GPU acceleration entirely.
- Customizations may be required to make this work with your hardware. 
*/

/* eslint-disable @typescript-eslint/no-unused-vars */
let enableSoftwareAcceleration = false; // set this to false to use hardware acceleration

/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import { audioExtensions, videoExtensions } from "../../constants/formats";

const execAsync = util.promisify(exec);

// Check VAAPI availability
async function checkVAAPI() {
  try {
    const { stdout, stderr } = await execAsync("ffmpeg -hwaccels");
    if (stderr) {
      console.error("Error in checking hardware accelerations:", stderr);
    }
    return stdout.includes("vaapi");
  } catch (error) {
    console.error("Error checking VAAPI:", error);
    return false;
  }
}

function isVideoFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase().slice(1);
  const isVideo = videoExtensions.includes(ext);
  return isVideo;
}

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get("file") as File | null;
  const format = data.get("format") as string | null;

  if (!file || !format) {
    return NextResponse.json({ error: "File or format missing." }, { status: 400 });
  }

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const originalFilePath = path.join(tempDir, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(originalFilePath, buffer);

  const outputFilePath = path.join(
    tempDir,
    `${path.basename(file.name, path.extname(file.name))}.${format}`
  );

  try {
    let isVAAPIAvailable = false;

    // Check if GPU acceleration should be skipped (force software encoding)
    if (!enableSoftwareAcceleration) {
      console.log("Skipping GPU check, forcing hardware acceleration.");
      isVAAPIAvailable = true;
    } else {
      console.log("Checking for VAAPI availability...");
      isVAAPIAvailable = await checkVAAPI();
      console.log("VAAPI available:", isVAAPIAvailable);
    }

    // Debugging the file type and which encoding method will be used
    console.log("isVideoFile check:", isVideoFile(file.name));  // Log the result of isVideoFile

    // Command templates for software and hardware encoding
    const softwareCommand = `ffmpeg -i "${originalFilePath}" -c:v libx264 -preset slow -crf 18 -map_metadata 0 "${outputFilePath}"`;

    const gpuCommand = `ffmpeg -hwaccel vaapi -vaapi_device /dev/dri/renderD128 -i "${originalFilePath}" \
-vf 'format=nv12,hwupload' -c:v h264_vaapi -qp 18 -map_metadata 0 -y "${outputFilePath}"`;

    // Final command selection based on conditions
    let command: string;

    if (enableSoftwareAcceleration) {
      console.log("Using software encoding for audio/video...");
      command = softwareCommand;
    } else if (isVideoFile(file.name) && isVAAPIAvailable) {
      // If VAAPI is available and it's a video, use hardware acceleration (GPU)
      console.log("Using VAAPI for hardware acceleration...");
      command = gpuCommand;
    } else {
      // If VAAPI is not available or not a video file, fall back to software encoding
      console.log("Using software encoding for audio/video...");
      command = softwareCommand;
    }

    // Check the constructed command for debugging
    console.log("FFmpeg command to be executed:", command);

    // Execute the command
    try {
      const { stdout, stderr } = await execAsync(command);
      if (stderr) {
        console.error("Error during conversion:", stderr);
      }
      console.log("Conversion successful:", stdout);
    } catch (gpuError) {
      console.error("Hardware acceleration failed. Falling back to software encoding.");
      // Fallback to software encoding in case of GPU errors
      const { stdout, stderr } = await execAsync(softwareCommand);
      if (stderr) {
        console.error("Error during fallback conversion:", stderr);
      }
      console.log("Fallback conversion successful:", stdout);
    }

    const outputBuffer = fs.readFileSync(outputFilePath);

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename=${path.basename(outputFilePath)}`,
      },
    });
  } catch (error) {
    console.error("Error during conversion:", error);
    return NextResponse.json({ error: "Conversion failed." }, { status: 500 });
  }
}
