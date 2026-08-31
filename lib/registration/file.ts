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

export function base64ToPdfUrl(data: string): string {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
}
