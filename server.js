import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import FormData from "form-data";

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS mejorada
app.use(cors({ 
    origin: ["http://127.0.0.1:5501", "http://localhost:5501", "http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Timeout para peticiones
const FETCH_TIMEOUT = 30000; // 30 segundos

// Función helper para timeout
function fetchWithTimeout(url, options = {}) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), FETCH_TIMEOUT)
        )
    ]);
}

// Función para generar con Pollinations (optimizada)
async function generateWithPollinations(prompt) {
    try {
        console.log("🎨 Generando con Pollinations AI...");
        
        // Limpiar y optimizar el prompt
        const cleanPrompt = prompt.replace(/[^\w\s,.-]/g, '').trim();
        const encodedPrompt = encodeURIComponent(cleanPrompt);
        
        // Generar seed aleatorio para variedad
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&enhance=true&nologo=true`;
        
        console.log("📍 URL generada:", imageUrl);
        
        const response = await fetchWithTimeout(imageUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (response.ok && response.status === 200) {
            const contentType = response.headers.get('content-type');
            console.log("📄 Content-Type:", contentType);
            
            if (contentType && contentType.startsWith('image/')) {
                const data = await response.buffer();
                console.log("✅ Imagen generada exitosamente con Pollinations");
                console.log("📏 Tamaño de imagen:", data.length, "bytes");
                
                return { success: true, data, service: "Pollinations AI", url: imageUrl };
            } else {
                console.log("❌ Respuesta no es una imagen válida");
                return { success: false, error: "Respuesta no es una imagen válida" };
            }
        } else {
            console.log(`❌ Error HTTP: ${response.status} - ${response.statusText}`);
            return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
    } catch (error) {
        console.error("❌ Error en Pollinations:", error.message);
        return { success: false, error: error.message };
    }
}

// Función para generar con Craiyon (mejorada)
async function generateWithCraiyon(prompt) {
    try {
        console.log("🎨 Intentando con Craiyon...");
        
        const response = await fetchWithTimeout("https://api.craiyon.com/v3", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            body: JSON.stringify({
                prompt: prompt,
                token: null,
                model: "art",
                negative_prompt: "low quality, blurry, distorted"
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.images && result.images.length > 0) {
                console.log("✅ Imagen generada con Craiyon");
                const base64Image = result.images[0];
                const imageBuffer = Buffer.from(base64Image, 'base64');
                return { success: true, data: imageBuffer, service: "Craiyon" };
            } else {
                return { success: false, error: "No se recibieron imágenes de Craiyon" };
            }
        } else {
            const errorText = await response.text();
            console.log("❌ Error Craiyon:", response.status, errorText);
            return { success: false, error: `Craiyon error: ${response.status}` };
        }
        
    } catch (error) {
        console.error("❌ Error en Craiyon:", error.message);
        return { success: false, error: error.message };
    }
}

// Función principal de generación (mejorada)
async function generateImageFree(prompt) {
    console.log("🚀 Iniciando generación de imagen...");
    console.log("📝 Prompt:", prompt);
    
    // Intentar con Pollinations primero (más confiable)
    console.log("🔄 Probando Pollinations AI...");
    const pollinationsResult = await generateWithPollinations(prompt);
    if (pollinationsResult.success) {
        console.log("🎉 Éxito con Pollinations AI!");
        return pollinationsResult;
    }
    console.log("⚠️ Pollinations falló, probando Craiyon...");
    
    // Si falla, intentar con Craiyon
    const craiyonResult = await generateWithCraiyon(prompt);
    if (craiyonResult.success) {
        console.log("🎉 Éxito con Craiyon!");
        return craiyonResult;
    }
    console.log("⚠️ Craiyon también falló");
    
    // Último recurso: servicio directo de Pollinations sin parámetros extra
    try {
        console.log("🔄 Intentando Pollinations modo fallback...");
        const encodedPrompt = encodeURIComponent(prompt);
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
        
        console.log("📍 URL fallback:", fallbackUrl);
        
        const response = await fetchWithTimeout(fallbackUrl);
        if (response.ok) {
            const data = await response.buffer();
            console.log("✅ Éxito con modo fallback!");
            return { success: true, data, service: "Pollinations AI (Fallback)" };
        }
    } catch (error) {
        console.log("❌ Error con modo fallback:", error.message);
    }
    
    console.log("💥 Todos los servicios fallaron");
    return { success: false, error: "Todos los servicios de IA están temporalmente no disponibles" };
}

// Endpoint principal mejorado
app.post('/generate-prompt', async (req, res) => {
    console.log("\n🚀 Nueva solicitud de generación recibida");
    console.log("📋 Body recibido:", req.body);
    
    try {
        const { respuestas } = req.body;

        if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
            console.log("❌ Respuestas inválidas");
            return res.status(400).json({ 
                error: 'Faltan respuestas válidas',
                message: 'Se requiere un array de respuestas no vacío'
            });
        }

        // Optimizar prompt para mejores resultados
        const basePrompt = respuestas.join(', ');
        const prompt = `Modern architectural design: ${basePrompt}, professional architecture, high quality, detailed building, contemporary style, realistic`;
        
        console.log('🎯 Prompt optimizado:', prompt);

        const result = await generateImageFree(prompt);
        
        if (!result.success) {
            console.log("💥 Generación falló:", result.error);
            return res.status(500).json({ 
                error: result.error,
                message: "Los servicios de IA están temporalmente no disponibles. Por favor, intenta más tarde.",
                debug: {
                    prompt: prompt,
                    timestamp: new Date().toISOString()
                }
            });
        }

        console.log("🎉 Imagen generada exitosamente con:", result.service);

        // Crear directorio para imágenes si no existe
        const imagesDir = path.join(process.cwd(), 'generated_images');
        if (!fs.existsSync(imagesDir)) {
            console.log("📁 Creando directorio de imágenes");
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        // Generar nombre único para la imagen
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const imageName = `imagen_${timestamp}_${randomId}.png`;
        const imagePath = path.join(imagesDir, imageName);

        // Guardar imagen con manejo de errores
        try {
            fs.writeFileSync(imagePath, result.data);
            console.log("💾 Imagen guardada en:", imagePath);
            console.log("📏 Tamaño del archivo:", fs.statSync(imagePath).size, "bytes");
        } catch (saveError) {
            console.error("❌ Error al guardar imagen:", saveError);
            return res.status(500).json({
                error: 'Error al guardar la imagen',
                details: saveError.message
            });
        }

        const imageUrl = `http://localhost:${PORT}/generated_images/${imageName}`;
        console.log("🌐 URL de imagen:", imageUrl);

        const response = {
            prompt,
            service: result.service,
            imagenIA: imageUrl,
            timestamp,
            message: `Imagen generada exitosamente con ${result.service}`,
            metadata: {
                filename: imageName,
                size: fs.statSync(imagePath).size,
                generatedAt: new Date().toISOString()
            }
        };

        console.log("📤 Enviando respuesta exitosa");
        res.json(response);

    } catch (error) {
        console.error('💥 Error crítico en la generación:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: 'Hubo un problema procesando tu solicitud',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint de prueba mejorado
app.get('/test-image', async (req, res) => {
    const testPrompt = req.query.prompt || "modern minimalist house with large windows";
    console.log("🧪 Generando imagen de prueba con prompt:", testPrompt);
    
    try {
        const result = await generateImageFree(testPrompt);
        
        if (result.success) {
            const timestamp = Date.now();
            const imageName = `test_${timestamp}.png`;
            const imagesDir = path.join(process.cwd(), 'generated_images');
            
            if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir, { recursive: true });
            }
            
            const imagePath = path.join(imagesDir, imageName);
            fs.writeFileSync(imagePath, result.data);
            
            const imageUrl = `http://localhost:${PORT}/generated_images/${imageName}`;
            console.log("✅ Imagen de prueba generada:", imageUrl);
            
            res.json({
                success: true,
                service: result.service,
                imageUrl: imageUrl,
                prompt: testPrompt,
                message: "Imagen de prueba generada exitosamente"
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                prompt: testPrompt
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            prompt: testPrompt
        });
    }
});

// Endpoint para probar conectividad
app.get('/test-services', async (req, res) => {
    console.log("🔍 Probando servicios disponibles...");
    const results = [];
    
    // Probar Pollinations
    try {
        const pollinationsResult = await generateWithPollinations("test house");
        results.push({
            service: "Pollinations AI",
            status: pollinationsResult.success ? "✅ Disponible" : "❌ No disponible",
            error: pollinationsResult.error || null,
            responseTime: "Fast"
        });
    } catch (error) {
        results.push({
            service: "Pollinations AI",
            status: "💥 Error",
            error: error.message,
            responseTime: "N/A"
        });
    }
    
    res.json({ 
        timestamp: new Date().toISOString(),
        services: results,
        serverStatus: "🟢 Online"
    });
});

// Servir archivos estáticos con headers apropiados
app.use('/generated_images', (req, res, next) => {
    res.header('Cache-Control', 'public, max-age=3600');
    res.header('Access-Control-Allow-Origin', '*');
    next();
}, express.static(path.join(process.cwd(), 'generated_images')));

app.use(express.static(".", {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Endpoint de estado
app.get('/health', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({ 
        status: '🟢 Healthy', 
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 60)} minutes`,
        memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
        },
        message: 'Servidor funcionando correctamente',
        availableEndpoints: [
            'POST /generate-prompt - Generar imagen',
            'GET /test-services - Probar servicios',
            'GET /test-image?prompt=your_prompt - Generar imagen de prueba',
            'GET /health - Estado del servidor'
        ]
    });
});

// Manejo de errores global mejorado
process.on("uncaughtException", (err) => {
    console.error("💥 Error crítico no capturado:", err);
    console.error("Stack:", err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 Promesa rechazada sin manejar en:", promise);
    console.error("Razón:", reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor gracefully...');
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor iniciado exitosamente!`);
    console.log(`📍 URL principal: http://localhost:${PORT}`);
    console.log(`🧪 Prueba servicios: http://localhost:${PORT}/test-services`);
    console.log(`🖼️  Genera prueba: http://localhost:${PORT}/test-image`);
    console.log(`💚 Estado: http://localhost:${PORT}/health`);
    console.log(`\n✨ ¡Listo para generar imágenes con IA!\n`);
});

