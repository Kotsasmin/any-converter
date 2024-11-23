import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);

async function checkVAAPI() {
  try {
    const { stdout, stderr } = await execAsync('ffmpeg -hwaccels');
    if (stderr) {
      console.error('Error in checking hardware accelerations:', stderr);
    }
    return stdout.includes('vaapi');
  } catch (error) {
    console.error('Error checking VAAPI:', error);
    return false;
  }
}

function isVideoFile(fileName: string): boolean {
  const videoExtensions = ['.mp4', '.mkv', '.mov', '.avi', '.flv', '.webm'];
  const ext = path.extname(fileName).toLowerCase();
  return videoExtensions.includes(ext);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isAudioFile(fileName: string): boolean {
  const audioExtensions = ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'];
  const ext = path.extname(fileName).toLowerCase();
  return audioExtensions.includes(ext);
}

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get('file') as File | null;
  const format = data.get('format') as string | null;

  if (!file || !format) {
    return NextResponse.json({ error: 'File or format missing.' }, { status: 400 });
  }

  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const originalFilePath = path.join(tempDir, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(originalFilePath, buffer);

  const outputFilePath = path.join(tempDir, `${path.basename(file.name, path.extname(file.name))}.${format}`);

  try {

    const isVAAPIAvailable = await checkVAAPI();

    let command: string;

    if (isVideoFile(file.name) && isVAAPIAvailable) {
      console.log('Using VAAPI for hardware acceleration...');
      command = `ffmpeg -hwaccel vaapi -vaapi_device /dev/dri/renderD128 -i "${originalFilePath}" \
-vf 'format=nv12,hwupload' -c:v h264_vaapi -qp 24 -y "${outputFilePath}"`;
    } else {

      console.log('Using software encoding for audio/video...');
      command = `ffmpeg -i "${originalFilePath}" "${outputFilePath}"`;
    }

    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.error('Error during conversion:', stderr);
    }
    console.log('Conversion successful:', stdout);

    const outputBuffer = fs.readFileSync(outputFilePath);

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${path.basename(outputFilePath)}`,
      },
    });
  } catch (error) {
    console.error('Error during conversion:', error);
    return NextResponse.json({ error: 'Conversion failed.' }, { status: 500 });
  }
}