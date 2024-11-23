/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { Check } from "lucide-react"; 
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "./components/mode-toggle";
import { Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Page() {

  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsDrawerOpen(true); 
    }
  };

  const handleFormatSelect = (selectedFormat: string | null) => {
    setFormat(selectedFormat); 
  };

  const handleConvert = async () => {
    if (!file || !format) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", format);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Conversion failed.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.split(".").slice(0, -1).join(".")}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to convert the file.");
    }
  };

  const getFileCategory = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext) return null;

    const fileCategories: Record<string, string[]> = {
      image: ["jpg", "png", "gif", "heic", "svg"],
      document: ["pdf", "doc", "docx", "xls", "csv"],
      audio: ["mp3", "wav", "m4a", "ogg", "flac"],
      video: ["mp4", "mov", "avi", "flv"],
    };

    for (const [category, extensions] of Object.entries(fileCategories)) {
      if (extensions.includes(ext)) return category;
    }

    return null;
  };

  const conversionOptions: Record<string, string[]> = {
    image: ["JPG", "PNG", "GIF", "HEIC", "SVG"],
    document: ["PDF", "DOC", "DOCX", "XLS", "CSV"],
    audio: ["MP3", "WAV", "M4A", "OGG", "FLAC"],
    video: ["MP4", "MOV", "AVI", "FLV"],
  };

  const primaryOptions: Record<string, string[]> = {
    image: ["Image"],
    document: ["Document"],
    audio: ["Audio"],
    video: ["Audio", "Video"],
  };

  const category = file ? getFileCategory(file.name) : null;

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen p-4">
      {}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-xl mx-auto p-6 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Any Converter</h1>

        {}
        <div className="flex flex-col items-center">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <Input
              id="fileInput"
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="mx-auto h-12 w-12" />
            <p className="mt-2 text-sm">Click to upload or drag and drop</p>
            <p className="text-xs">
              Supported formats: MP3, MP4, MOV, MKV, and more
            </p>
          </div>
          {file && (
            <div className="mt-4 text-sm">
              Selected file: <span className="font-medium">{file.name}</span>
            </div>
          )}
        </div>

        {}
        {file && isDrawerOpen && (
          <div className="mt-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!file}>
                  {file ? "Select Conversion Type" : "Upload a File First"}
                </Button>
              </DropdownMenuTrigger>

              {category && (
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Select a Format</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {}
                  {(primaryOptions[category] || []).map((primaryOption) => (
                    <DropdownMenuSub key={primaryOption}>
                      <DropdownMenuSubTrigger>
                        {primaryOption}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {(
                          conversionOptions[primaryOption.toLowerCase()] ||
                          conversionOptions[category] ||
                          []
                        ).map((option) => (
                          <DropdownMenuItem
                            key={option}
                            onClick={() => handleFormatSelect(option)}
                            className="flex items-center" 
                          >
                            {format === option && (
                              <Check className="mr-2" size={16} /> 
                            )}
                            {option}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ))}
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          </div>
        )}

        {}
        <Button
          className="w-full mt-4"
          disabled={!file || !format}
          onClick={handleConvert}
        >
          Convert File
        </Button>
      </div>
    </main>
  );

}