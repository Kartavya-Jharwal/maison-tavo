import {
  type CatalogSearchInput,
  type Context,
  type LineItemInput,
  UcpClient,
} from '@maison-tavo/ucp';

/** Shopping agent that searches the store and builds carts on a buyer's behalf. */
export class ShopperAgent {
  private clientPromise: Promise<UcpClient> | undefined;

  constructor(
    private readonly businessUrl: string,
    private readonly agentProfileUrl: () => string,
  ) {}

  private client() {
    this.clientPromise ??= UcpClient.discover(this.businessUrl, this.agentProfileUrl()).then(
      ({client}) => client,
    );
    this.clientPromise.catch(() => (this.clientPromise = undefined));
    return this.clientPromise;
  }

  async search(input: CatalogSearchInput) {
    return (await this.client()).searchCatalog(input);
  }

  async createCart(lineItems: LineItemInput[], context?: Context) {
    return (await this.client()).createCart(lineItems, context);
  }
}
