#!/usr/bin/env bun
/**
 * Proof script for the agentic commerce pillar (M2 / D4).
 *
 * Runs the constraint evaluator against the live Shopify store and prints
 * the validated cart — the end-to-end proof that structured spec data
 * enables automated query-to-cart assembly.
 *
 * Usage:
 *   bun run apps/agents/src/demo.ts
 *   (requires apps/agents/.env with SHOPIFY_STOREFRONT_TOKEN set)
 */
import {ShopperAgent} from './shopper';
import {config} from './config';
import type {HeatSource} from '@maison-tavo/catalog/src/schema';

const QUERY = {
  description: 'Assemble a 5-piece set under $1,800 suitable for induction searing and clay slow-cooking',
  params: {
    budget_usd: 1800,
    piece_count: 5,
    heat_sources: ['induction'] as HeatSource[],
    use_cases: ['searing', 'clay slow-cooking', 'induction', 'skillet'],
  },
};

console.log('─'.repeat(60));
console.log('Maison Tavo — Agentic Commerce Proof (M2 / D4)');
console.log('─'.repeat(60));
console.log(`\nQuery: "${QUERY.description}"\n`);

const agent = new ShopperAgent(config.businessUrl, () => config.agentProfileUrl);

try {
  const cart = await agent.query(QUERY.params);

  console.log('Matched pieces:');
  for (const item of cart.line_items) {
    const price = item.item.price != null ? `$${(item.item.price / 100).toFixed(2)}` : '(price unavailable)';
    console.log(`  • ${item.item.title ?? 'Unknown product'} — ${price}`);
  }

  const subtotal = cart.totals.find((t) => t.type === 'subtotal');
  const totalDisplay = subtotal?.display_text ?? subtotal?.amount != null
    ? `$${(subtotal!.amount / 100).toFixed(2)}`
    : '(total unavailable)';

  console.log(`\nCart total: ${totalDisplay}`);
  console.log(`Cart ID:    ${cart.id}`);

  if (cart.continue_url) {
    console.log(`Checkout:   ${cart.continue_url}`);
  }

  console.log('\n✓ Proof query passed — live Shopify cart assembled from spec constraints.');
} catch (err) {
  if (err instanceof Error) {
    console.error(`\n✗ Proof query failed: ${err.message}`);

    if (err.message.includes('SHOPIFY_STOREFRONT_TOKEN')) {
      console.error('\nHint: Add SHOPIFY_STOREFRONT_TOKEN to apps/agents/.env');
      console.error('  Get it from: Shopify Admin → Apps → Storefront API → Tokens');
    }

    if (err.message.includes('No SKUs matched')) {
      console.error('\nNote: The catalog filter returned no matching SKUs.');
      console.error('  Check that heat_sources and budget are compatible with the seed catalog.');
    }
  } else {
    console.error(err);
  }
  process.exit(1);
}
