import fs from 'fs';
import path from 'path';

export function deleteAllFilesInDirectory(directoryPath) {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error(`Error al leer la carpeta: ${err.message}`);
            return;
        }
        files.forEach(file => {
            const filePath = path.join(directoryPath, file);
            fs.unlink(filePath, err => {
                if (err) {
                    console.error(`Error al eliminar el archivo ${filePath}: ${err.message}`);
                }
            });
        });
    });
}
