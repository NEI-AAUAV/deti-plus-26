export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('The file could not be read.'));
        return;
      }

      const comma = result.indexOf(',');
      if (comma === -1) {
        reject(new Error('The file could not be read.'));
        return;
      }

      resolve(result.slice(comma + 1));
    };

    reader.readAsDataURL(file);
  });
}
