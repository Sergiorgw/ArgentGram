document.addEventListener('DOMContentLoaded', () => {
    const captureBtn = document.getElementById('captureBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const photoReel = document.getElementById('photoReel');

    if (photoReel) {
        loadExistingImages(); 
        // Event listener para capturar una nueva foto al hacer clic en el botón
        captureBtn.addEventListener('click', async () => {
            try {
                const capturedImage = await capturePhoto();
                const { value: userTitle } = await Swal.fire({
                    title: 'Ingrese un título para la imagen:',
                    input: 'text',
                    inputLabel: 'Título',
                    inputPlaceholder: 'Escriba el título aquí...',
                    inputAttributes: {
                        'aria-label': 'Escriba el título aquí'
                    },
                    showCancelButton: true
                });

                if (userTitle) { // Verifica si el usuario ingresó un título
                    const imageData = await processImage(capturedImage, userTitle);
                    await publishPhoto(imageData);
                    displayPhoto(imageData);
                }
            } catch (error) {
                console.error('Error al capturar y publicar la foto:', error);
                alert('Ocurrió un error al procesar la foto. Inténtalo de nuevo.');
            }
        });

        // Event listener para permitir al usuario seleccionar una foto existente
        uploadBtn.addEventListener('change', async (event) => {
            const uploadedFile = event.target.files[0];
            if (uploadedFile) {
                try {
                    const { value: userTitle } = await Swal.fire({
                        title: 'Ingrese un título para la imagen:',
                        input: 'text',
                        inputLabel: 'Título',
                        inputPlaceholder: 'Escriba el título aquí...',
                        inputAttributes: {
                            'aria-label': 'Escriba el título aquí'
                        },
                        showCancelButton: true
                    });

                    if (userTitle) { // Verifica si el usuario ingresó un título
                        const imageDataURL = await readFileAsDataURL(uploadedFile);
                        const imageData = await processImage(imageDataURL, userTitle);
                        await publishPhoto(imageData);
                        displayPhoto(imageData);
                    }
                } catch (error) {
                    console.error('Error al procesar la foto cargada:', error);
                    alert('Ocurrió un error al procesar la foto cargada. Inténtalo de nuevo.');
                }
            }
        });
    } else {
        console.error('Elemento photoReel no encontrado en el DOM.');
    }

    // Función para cargar y mostrar todas las imágenes existentes desde mockapi.io
    async function loadExistingImages() {
        try {
            const response = await fetch('https://6626f956b625bf088c0706c7.mockapi.io/api/v1/images');
            const imageDataList = await response.json();
            imageDataList.forEach(imageData => {
                displayPhotoFromBase64(imageData);
            });
        } catch (error) {
            console.error('Error al cargar las imágenes existentes:', error);
        }
    }

    // Función para mostrar una imagen existente desde base64 en el photoReel
    function displayPhotoFromBase64(imageData) {
        const photoCard = document.createElement('div');
        photoCard.classList.add('photoCard');
        const imgElement = document.createElement('img');
        imgElement.src = `data:image/png;base64,${imageData.image}`;
        imgElement.alt = imageData.title;
        const titleElement = document.createElement('div');
        titleElement.classList.add('caption');
        titleElement.textContent = imageData.title;
        const timestampElement = document.createElement('div');
        timestampElement.classList.add('timestamp');
        timestampElement.textContent = imageData.timestamp;
        photoCard.appendChild(imgElement);
        photoCard.appendChild(titleElement);
        photoCard.appendChild(timestampElement);
        photoReel.appendChild(photoCard);
    }


    // Función para capturar una foto utilizando la cámara del dispositivo
    async function capturePhoto() {
        return new Promise((resolve, reject) => {
            // Lógica para acceder a la cámara y capturar la imagen
            const videoElement = document.createElement('video');
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    videoElement.srcObject = stream;
                    videoElement.play();
                    videoElement.addEventListener('loadedmetadata', () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = videoElement.videoWidth;
                        canvas.height = videoElement.videoHeight;
                        canvas.getContext('2d').drawImage(videoElement, 0, 0);
                        const imageDataURL = canvas.toDataURL('image/webp');
                        videoElement.srcObject.getTracks().forEach(track => track.stop());
                        resolve(imageDataURL);
                    });
                })
                .catch(error => reject(error));
        });
    }

    // Función para procesar la imagen y agregar un título personalizado
    function processImage(imageDataURL, title) {
        return new Promise((resolve, reject) => {
            const imageObject = {
                dataURL: imageDataURL,
                title: title || 'New Photo', // Utiliza el título proporcionado o uno por defecto
                timestamp: new Date().toLocaleString() // Fecha y hora actual
            };
            resolve(imageObject);
        });
    }

    // Función para leer un archivo como URL de datos (Data URL)
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }

    // Función para publicar la imagen en MOCKAPI.IO en formato Base64
    async function publishPhoto(imageData) {
        try {
            // Convierte la imagen en formato Base64
            const base64Image = await convertImageToBase64(imageData.dataURL);

            // Crea un objeto con los datos de la imagen en formato Base64 y el título
            const imageDataBase64 = {
                title: imageData.title,
                image: base64Image,
                timestamp: imageData.timestamp
            };

            // Realiza la solicitud POST a MOCKAPI.IO con los datos en formato Base64
            const response = await fetch('https://6626f956b625bf088c0706c7.mockapi.io/api/v1/images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(imageDataBase64)
            });

            const data = await response.json();
            console.log('Imagen publicada:', data);
        } catch (error) {
            throw new Error('Error al publicar la foto en MOCKAPI.IO');
        }
    }

    // Función para convertir una imagen en formato Data URL a Base64
    function convertImageToBase64(dataURL) {
        return new Promise((resolve, reject) => {
            try {
                // Extrae la parte base64 de la URL de datos
                const base64Image = dataURL.split(';base64,').pop();
                resolve(base64Image);
            } catch (error) {
                reject(error);
            }
        });
    }

    function displayPhoto(imageData) {
        // Función para mostrar una imagen en el photoReel
        const photoCard = document.createElement('div');
        photoCard.classList.add('photoCard');
        photoCard.innerHTML = `
            <img src="${imageData.dataURL}" alt="${imageData.title}">
            <div class="caption">${imageData.title}</div>
            <div class="timestamp">${imageData.timestamp}</div>
        `;
        photoReel.appendChild(photoCard);
    }
});