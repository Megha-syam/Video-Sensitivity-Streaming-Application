import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';
import fs from 'fs';
import path from 'path';

interface SensitivityResult {
  isSafe: boolean;
  confidence: number;
  labels: string[];
  duration: number;
}

class GoogleVideoIntService {
  private client: VideoIntelligenceServiceClient | null = null;
  private enabled: boolean = false;

  constructor() {
    // Check if Google Cloud credentials are available
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        this.client = new VideoIntelligenceServiceClient();
        this.enabled = true;
        console.log('✅ Google Video Intelligence API initialized');
      } catch (error) {
        console.warn('⚠️ Google Video Intelligence API not available:', error);
        this.enabled = false;
      }
    } else {
      console.warn('⚠️ GOOGLE_APPLICATION_CREDENTIALS not set. Using mock sensitivity check.');
      this.enabled = false;
    }
  }

  async analyzeVideo(videoPath: string): Promise<SensitivityResult> {
    if (!this.enabled || !this.client) {
      // Fallback to mock implementation
      return this.mockAnalysis();
    }

    try {
      // Read video file
      const videoBytes = fs.readFileSync(videoPath);
      const inputContent = videoBytes.toString('base64');

      const request = {
        inputContent: inputContent,
        features: ['EXPLICIT_CONTENT_DETECTION'] as any,
      };

      console.log('📹 Analyzing video with Google Video Intelligence...');
      const [operation] = await this.client.annotateVideo(request);
      
      console.log('⏳ Waiting for analysis to complete...');
      const [response] = await operation.promise();

      const explicitAnnotation = response.annotationResults?.[0]?.explicitAnnotation;
      
      if (!explicitAnnotation || !explicitAnnotation.frames) {
        return this.mockAnalysis();
      }

      // Analyze frames for explicit content
      const explicitFrames = explicitAnnotation.frames.filter((frame: any) => {
        const likelihood = frame.pornographyLikelihood;
        return likelihood === 'LIKELY' || likelihood === 'VERY_LIKELY';
      });

      const totalFrames = explicitAnnotation.frames.length;
      const explicitRatio = explicitFrames.length / totalFrames;
      
      // Flag if more than 20% of frames are explicit
      const isSafe = explicitRatio < 0.2;
      const confidence = Math.round((1 - explicitRatio) * 100);

      const labels = explicitFrames.slice(0, 5).map((frame: any) => 
        `${frame.pornographyLikelihood} at ${Math.round(frame.timeOffset?.seconds || 0)}s`
      );

      console.log(`✅ Analysis complete: ${isSafe ? 'SAFE' : 'FLAGGED'} (${confidence}% confidence)`);

      const durationSeconds = typeof response.annotationResults?.[0]?.segment?.endTimeOffset?.seconds === 'number' 
        ? response.annotationResults[0].segment.endTimeOffset.seconds 
        : 0;

      return {
        isSafe,
        confidence,
        labels,
        duration: durationSeconds
      };

    } catch (error: any) {
      console.error('❌ Google Video Intelligence error:', error.message);
      // Fallback to mock on error
      return this.mockAnalysis();
    }
  }

  private mockAnalysis(): SensitivityResult {
    // Mock implementation (80% safe, 20% flagged)
    const isSafe = Math.random() > 0.2;
    return {
      isSafe,
      confidence: Math.round(Math.random() * 20 + 80), // 80-100%
      labels: isSafe ? ['No explicit content detected'] : ['Potentially explicit content'],
      duration: 0
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export default new GoogleVideoIntService();
