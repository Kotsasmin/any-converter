
const categoriesWithExtensions: Record<string, string[]> = {
    image: ["jpg", "png", "gif", "heic", "svg"],
    document: ["pdf", "doc", "docx", "xls", "csv"],
    audio: ["mp3", "wav", "m4a", "ogg", "flac"],
    video: ["mp4", "mov", "avi", "flv"],
  };
  

  const capitalizeExtensions = (extensions: string[]): string[] =>
    extensions.map(ext => ext.toUpperCase());
  

  export const fileCategories = categoriesWithExtensions;
  
  export const conversionOptions = Object.fromEntries(
    Object.entries(categoriesWithExtensions).map(([category, extensions]) => [
      category,
      capitalizeExtensions(extensions),
    ])
  );
  
  export const primaryOptions: Record<string, string[]> = {
    image: ["Image"],
    document: ["Document"],
    audio: ["Audio"],
    video: ["Audio", "Video"],
  };
  
  export const audioExtensions = fileCategories.audio;
  export const videoExtensions = fileCategories.video;
  