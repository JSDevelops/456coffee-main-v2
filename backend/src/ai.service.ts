import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { PrismaService } from './prisma.service';

interface ProductSummary {
  name: string;
  description?: string | null;
  price: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY ?? '';
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } else {
      this.logger.warn(
        'GEMINI_API_KEY not set — AI coffee recommendation is disabled.',
      );
    }
  }

  // Pull a small product list and ask Gemini to recommend.
  async recommendFromMenu(userInput: string) {
    const products = await this.prisma.product.findMany({ take: 5 });
    return this.recommendCoffee(userInput, products);
  }

  async recommendCoffee(userInput: string, products: ProductSummary[]) {
    if (!this.model)
      return "I can't recommend coffee right now, but our Dirty Coffee is great!";

    const productList = products
      .map((p) => `${p.name}: ${p.description ?? ''} (฿${p.price})`)
      .join('\n');

    const prompt = `
      You are an expert barista at "456 Coffee". 
      A customer says: "${userInput}"
      
      Here is our menu:
      ${productList}
      
      Suggest the best coffee for them. Keep it short (max 2 sentences) and friendly.
      IMPORTANT: Please respond entirely in Thai (ภาษาไทย).
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini error:', error);
      return "Based on your mood, I'd suggest our signature Dirty Coffee!";
    }
  }
}
