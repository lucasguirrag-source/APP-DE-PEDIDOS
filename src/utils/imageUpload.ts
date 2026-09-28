/**
 * Helper to compress and convert any uploaded image File into an optimized DataURL.
 * This guarantees fast loading, avoids breaking localStorage limits, and renders everywhere.
 */
export const compressAndConvertImage = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }

        // Fill background dark for transparent PNGs converted to JPEG
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error('Falha ao carregar a imagem selecionada.'));
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Não foi possível ler o arquivo.'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Otimiza e envia a imagem para o servidor, salvando-a fisicamente no disco.
 * Retorna uma URL estática definitiva (ex: /uploads/img_12345.jpg),
 * evitando estouro da cota de 5MB do localStorage e garantindo que ela nunca volte ao padrão.
 */
export async function uploadImageToServer(
  fileOrBase64: File | string,
  prefix = 'item',
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.85
): Promise<string> {
  let base64 = '';
  if (typeof fileOrBase64 === 'string') {
    if (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://') || fileOrBase64.startsWith('/uploads/')) {
      return fileOrBase64;
    }
    base64 = fileOrBase64;
  } else {
    base64 = await compressAndConvertImage(fileOrBase64, maxWidth, maxHeight, quality);
  }

  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, prefix }),
    });
    const data = await res.json();
    if (data.success && data.url) {
      return data.url;
    }
  } catch (err) {
    console.warn('Servidor indisponível para upload, mantendo imagem local:', err);
  }
  return base64;
}
