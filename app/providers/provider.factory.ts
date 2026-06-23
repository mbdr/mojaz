/**
 * Provider Factory
 * Factory pattern for managing provider instances
 * Supports adding multiple providers in the future
 */

import { VehicleReportProvider } from "./provider.interface";
import { MojazProvider } from "./mojaz.provider";

export class ProviderFactory {
  private static providers: Map<string, VehicleReportProvider> = new Map();
  private static factories: Map<string, () => VehicleReportProvider> = new Map([
    ["mojaz", () => new MojazProvider()],
  ]);

  /**
   * Register a provider instance
   */
  static registerProvider(name: string, provider: VehicleReportProvider): void {
    this.providers.set(name.toLowerCase(), provider);
  }

  /**
   * Get a provider by name, instantiating it lazily on first use so that
   * missing environment configuration only fails at request time, not at
   * module load / build time.
   */
  static getProvider(name: string = "mojaz"): VehicleReportProvider {
    const key = name.toLowerCase();

    let provider = this.providers.get(key);
    if (!provider) {
      const factory = this.factories.get(key);
      if (!factory) {
        throw new Error(`Provider "${name}" not found`);
      }
      provider = factory();
      this.providers.set(key, provider);
    }

    return provider;
  }

  /**
   * Get all available providers
   */
  static getAvailableProviders(): string[] {
    return Array.from(new Set([...this.providers.keys(), ...this.factories.keys()]));
  }
}
