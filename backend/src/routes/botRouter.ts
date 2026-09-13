import { Router, Request, Response } from 'express';
import { processBotMessage } from '../services/botService';

export const botRouter = Router();

/**
 * POST /api/bot/chat
 * Web Live Chatbot endpoint
 */
botRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const botResponse = await processBotMessage(message || '');
    res.json({
      success: true,
      ...botResponse,
    });
  } catch (error: any) {
    console.error('[BotRouter] Error processing chat message:', error);
    res.status(500).json({
      success: false,
      text: 'සමාවන්න, පද්ධතියේ සුළු දෝෂයක් පවතී. කරුණාකර නැවත උත්සාහ කරන්න හෝ WhatsApp මගින් Conductor අමතන්න.',
      error: error?.message || 'Internal Server Error',
    });
  }
});
