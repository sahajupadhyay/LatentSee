import { NextResponse } from 'next/server';
import { testAIServices, testBudgetTracking } from '@/lib/ai/test-utils';

/**
 * AI Test API Endpoint
 * 
 * Simple endpoint to test AI functionality and verify
 * OpenAI API key is working correctly.
 */

export async function GET() {
  try {
    // Test AI services availability and functionality
    const serviceTest = await testAIServices();
    
    // Test budget tracking functionality
    const budgetTest = await testBudgetTracking();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      aiServices: serviceTest,
      budgetTracking: budgetTest,
      message: serviceTest.isAvailable 
        ? 'AI services are working correctly!' 
        : 'AI services configuration issue detected'
    });

  } catch (error) {
    console.error('AI test endpoint failed:', error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'AI services test failed'
    }, { status: 500 });
  }
}