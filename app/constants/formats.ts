const categoriesWithExtensions: Record<string, string[]> = {
    image: ["jpg", "png", "gif", "heic", "svg", "bmp"],
    document: ["pdf", "doc", "docx", "xls", "csv", "txt"],
    audio: ["mp3", "wav", "m4a", "ogg", "flac", "aac", "aiff", "wma"],
    video: ["mp4", "mov", "avi", "flv", "mkv", "webm", "wmv", "mpeg", "mts"],
  };
  
  

  const capitalizeExtensions = (extensions: string[]): string[] =>
    extensions.map(ext => ext.toUpperCase());
  


  
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
  
  export const fileCategories = categoriesWithExtensions;
  export const audioExtensions = fileCategories.audio;
  export const videoExtensions = fileCategories.video;
  