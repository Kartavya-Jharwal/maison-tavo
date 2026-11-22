# Legal copy for the Maison Tavo exhibition

The password-gated exhibition shows how the store might work. Treat the terms as a non-binding visitor statement. The soul clause is the only fictional legal joke and sits inside a keyboard-accessible disclosure. Opening it creates no record and has no connection to entry, purchase or privacy choices.

## Where the copy lives

| Visitor page | Theme source |
| --- | --- |
| `/pages/terms-of-service` | [Terms](terms.md) and the [legal copy snippet](../snippets/maison-legal-copy.liquid) |
| `/pages/privacy-policy` | [Privacy notice](privacy.md) and the legal copy snippet |
| `/pages/intellectual-property` | [Intellectual property](ipr.md) and the legal copy snippet |
| `/pages/cookie-policy` | [Browser storage template](../templates/page.cookies.json) |
| `/pages/delivery-returns` | [Delivery and returns template](../templates/page.shipping.json) |
| `/pages/refund-returns-policy` | [Refund and Returns Policy template](../templates/page.refund-returns-policy.json) |
| `/pages/track-order` | [Track Order template](../templates/page.track-order.json) |
| `/pages/start-a-return` | [Start a Return template](../templates/page.start-a-return.json) |
| `/pages/faq` | [Merged interactive FAQ template](../templates/page.faq.json) |

The three Markdown documents mirror the default Liquid copy for review. Update both sources together. A rich-text body saved in the Shopify theme editor overrides the corresponding Liquid default. Shopify’s Admin policies are separate records with their own routes and can appear at checkout. When previewing, verify the page-template assignments and merchant overrides.

## What the prototype does with data

| Feature | Where it writes |
| --- | --- |
| Optional cooking questionnaire | Browser local storage holds hob, cooking style, optional email and save time. The catalogue tags use the two cooking preferences. |
| Embedded Kansa | Browser local storage holds the selected product, current view and up to 40 recent messages, plus suggested follow-ups. The browser fetches the catalogue separately without message text. |
| Optional Kansa microphone | The browser's speech service transcribes audio. Processing can occur off-device, depending on the browser. [Web Speech API specifications](https://webaudio.github.io/web-speech-api/#cloud-based-vs-on-device-implementations) |
| Saved pieces and display preferences | Browser storage remembers relevant choices between visits. |
| Dismissals and visit state | Session storage remembers parts of the current visit, including whether the questionnaire was dismissed. |
| Contact and email signup | The separate Shopify-hosted submissions send the information entered into those forms. |
| Entry, accounts and test checkout | Shopify can use its own storage and process information submitted to those services. |

The footer reset clears local and session storage for the storefront origin and attempts to expire theme cookies whose name begins with `mt_`. Treat the reset as a browser action. Shopify account and checkout data, submitted forms, remaining cookies and data held by other origins have separate controls. The custom theme bar currently saves an `mt_cookie_tier` preference. Verify actual consent enforcement through Shopify’s Customer Privacy settings and any installed apps. [Shopify customer privacy settings](https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings)

Verify test payment mode before inviting anyone to exercise checkout. Use operator-supplied test details. Treat private Admin configuration as unconfirmed until someone checks it. [Shopify test orders](https://help.shopify.com/en/manual/checkout-settings/test-orders)

## Before accepting real orders

- Ask the store operator and qualified counsel to confirm the trading entity, markets and applicable law. Approve the actual order and payment terms, cancellation and returns rights, refunds, delivery costs and windows, and mandatory guarantees. Check that the customer sees those terms before payment and can retain them afterwards. [GOV.UK online selling](https://www.gov.uk/online-and-distance-selling-for-businesses/online-selling) · [GOV.UK distance selling](https://www.gov.uk/online-and-distance-selling-for-businesses/distance-selling)
- Confirm the data controller and privacy contact, actual purposes and lawful bases, recipients, retention, transfers and rights. Audit storage, pixels and app embeds against their real behaviour, including choices before optional storage and how visitors change those choices. Include the public gate host and any future voice, AR or remote assistant integration in that review. [ICO right to be informed](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-be-informed/) · [ICO storage and access technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-storage-and-access-technologies/)
- Keep the fictional customer voices clearly labelled as scenarios wherever they appear. Keep them out of review counts, testimonial imports and rating markup. Ground durability, origin, compatibility, food-contact and pressure claims in evidence for the exact product. [ASA guidance on fake reviews](https://www.asa.org.uk/advice-online/fake-consumer-reviews.html) · [ASA guidance on testimonials](https://www.asa.org.uk/advice-online/testimonials-and-endorsements.html)
- Record the contributor, permission and scope for each image, font, piece of audio, prototype asset and artisan story. Preserve asset-specific licences and agree whether the work can also appear in social previews, downloadable material or machine feeds. [UK Intellectual Property Office guidance](https://www.gov.uk/guidance/a-quick-guide-to-protecting-your-creative-work)
