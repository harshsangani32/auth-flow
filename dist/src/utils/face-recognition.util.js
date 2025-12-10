"use strict";
// Face recognition utility
// Supports multiple methods: face-api.js (frontend), Cloud Vision API, or basic verification
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicFaceVerification = exports.verifyFaceWithCloudVision = exports.verifyFaceWithDescriptor = void 0;
/**
 * Verify face using face descriptor from face-api.js (sent from frontend)
 * This is a basic verification - in production, you'd compare with stored face descriptors
 */
const verifyFaceWithDescriptor = async (faceDescriptor, storedDescriptor) => {
    try {
        // If no stored descriptor, just verify that a descriptor exists
        if (!storedDescriptor) {
            return {
                verified: faceDescriptor && faceDescriptor.length > 0,
                confidence: 0.5,
                method: "face-api.js-basic",
            };
        }
        // Calculate Euclidean distance between descriptors
        if (faceDescriptor.length !== storedDescriptor.length) {
            return {
                verified: false,
                confidence: 0,
                method: "face-api.js",
                error: "Descriptor dimensions don't match",
            };
        }
        let distance = 0;
        for (let i = 0; i < faceDescriptor.length; i++) {
            distance += Math.pow(faceDescriptor[i] - storedDescriptor[i], 2);
        }
        distance = Math.sqrt(distance);
        // Threshold for face matching (lower is better match)
        // Typical threshold is around 0.6 for face-api.js
        const threshold = 0.6;
        const verified = distance < threshold;
        const confidence = verified ? Math.max(0, 1 - distance / threshold) : 0;
        return {
            verified,
            confidence,
            method: "face-api.js",
        };
    }
    catch (error) {
        return {
            verified: false,
            confidence: 0,
            method: "face-api.js",
            error: error.message,
        };
    }
};
exports.verifyFaceWithDescriptor = verifyFaceWithDescriptor;
/**
 * Verify face using Google Cloud Vision API
 * Requires GOOGLE_CLOUD_VISION_API_KEY in environment
 */
const verifyFaceWithCloudVision = async (imageBuffer) => {
    try {
        // This is a placeholder - you would integrate with Google Cloud Vision API
        // For now, return a basic verification
        const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
        if (!apiKey) {
            // Fallback: basic image verification (just check if image exists)
            return {
                verified: imageBuffer && imageBuffer.length > 0,
                confidence: 0.5,
                method: "cloud-vision-fallback",
            };
        }
        // TODO: Implement actual Google Cloud Vision API call
        // Example:
        // const vision = require('@google-cloud/vision');
        // const client = new vision.ImageAnnotatorClient();
        // const [result] = await client.faceDetection({
        //   image: { content: imageBuffer }
        // });
        // const faces = result.faceAnnotations;
        // return { verified: faces.length > 0, confidence: faces[0]?.detectionConfidence || 0 };
        return {
            verified: true,
            confidence: 0.7,
            method: "cloud-vision",
        };
    }
    catch (error) {
        return {
            verified: false,
            confidence: 0,
            method: "cloud-vision",
            error: error.message,
        };
    }
};
exports.verifyFaceWithCloudVision = verifyFaceWithCloudVision;
/**
 * Basic face verification - just checks if image is provided
 * Used as fallback when no face recognition method is specified
 */
const basicFaceVerification = async (imageBuffer) => {
    return {
        verified: imageBuffer !== undefined && imageBuffer.length > 0,
        confidence: 0.5,
        method: "basic",
    };
};
exports.basicFaceVerification = basicFaceVerification;
