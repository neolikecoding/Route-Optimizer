import { GoogleGenAI, Type } from "@google/genai";
import { Address } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ParsedAddressResponse {
  originalAddress: string;
  houseNumber: string;
  streetName: string;
  city: string;
  state: string;
  zip: string;
  isValid: boolean;
  error?: string;
}

const BATCH_SIZE = 50; // Process addresses in chunks to avoid hitting API limits

export const parseAndValidateAddresses = async (
  addresses: string[],
  onProgress: (processed: number, total: number) => void
): Promise<ParsedAddressResponse[]> => {
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    batches.push(addresses.slice(i, i + BATCH_SIZE));
  }

  const allParsedAddresses: ParsedAddressResponse[] = [];
  let processedCount = 0;

  for (const batch of batches) {
    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Parse the following list of addresses. For each address, identify the house number, street name, city, state, and ZIP code. If the ZIP code is missing, find the correct one. Mark if the address appears valid. Addresses: ${JSON.stringify(batch)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalAddress: { type: Type.STRING },
                houseNumber: { type: Type.STRING },
                streetName: { type: Type.STRING },
                city: { type: Type.STRING },
                state: { type: Type.STRING },
                zip: { type: Type.STRING },
                isValid: { type: Type.BOOLEAN },
                error: { type: Type.STRING, description: "Reason why the address is not valid, if applicable." }
              },
              required: ["originalAddress", "houseNumber", "streetName", "city", "state", "zip", "isValid"]
            }
          },
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingBudget: 100 },
        },
      });

      responseText = response.text?.trim();

      if (!responseText) {
        throw new Error("The AI service returned an empty response for a batch.");
      }
      
      // Clean up potential markdown code blocks
      if (responseText.startsWith("```json")) {
          responseText = responseText.substring(7, responseText.length - 3).trim();
      } else if (responseText.startsWith("```")) {
          responseText = responseText.substring(3, responseText.length - 3).trim();
      }

      const parsedJson = JSON.parse(responseText) as ParsedAddressResponse[];
      allParsedAddresses.push(...parsedJson);
      
      processedCount += batch.length;
      onProgress(Math.min(processedCount, addresses.length), addresses.length);
      
    } catch (error) {
      console.error("Error parsing a batch of addresses with Gemini:", error);
      if (error instanceof SyntaxError) {
        console.error("Gemini response text for the failed batch:", responseText);
      }
      throw new Error("The AI service failed to return a valid response for a batch. Please try again.");
    }
  }

  return allParsedAddresses;
};


interface OptimizedRouteResponse {
    optimizedRoute: { id: number }[];
}

export const optimizeRoute = async (addresses: Address[]): Promise<Address[]> => {
    let responseText = '';
    try {
        const addressesForApi = addresses.map(addr => ({
            id: addr.id,
            address: `${addr.houseNumber} ${addr.streetName}, ${addr.city}, ${addr.state} ${addr.zip}`
        }));

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an expert logistician. Given this list of addresses with IDs, determine the most efficient travel route to visit all of them. The starting point is the first address in the list. Return the full list of address objects, sorted in the optimal travel order. Addresses: ${JSON.stringify(addressesForApi)}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        optimizedRoute: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.NUMBER },
                                    address: { type: Type.STRING }
                                }
                            }
                        }
                    },
                    required: ["optimizedRoute"]
                },
                maxOutputTokens: 8192,
                thinkingConfig: { thinkingBudget: 100 },
            },
        });

        responseText = response.text?.trim();

        if (!responseText) {
          throw new Error("The AI service returned an empty response. This could be due to a content filter or an API issue.");
        }

        // Clean up potential markdown code blocks
        if (responseText.startsWith("```json")) {
            responseText = responseText.substring(7, responseText.length - 3).trim();
        } else if (responseText.startsWith("```")) {
            responseText = responseText.substring(3, responseText.length - 3).trim();
        }

        const parsedJson = JSON.parse(responseText) as OptimizedRouteResponse;
        
        const originalAddressMap = new Map(addresses.map(addr => [addr.id, addr]));
        const sortedAddresses = parsedJson.optimizedRoute
            .map(sortedAddr => originalAddressMap.get(sortedAddr.id))
            .filter((addr): addr is Address => !!addr);
            
        if (sortedAddresses.length !== addresses.length) {
          console.warn("Mismatch in optimized route length. Returning original order.");
          return addresses;
        }

        return sortedAddresses;
    } catch (error) {
        console.error("Error optimizing route with Gemini:", error);
        if (error instanceof SyntaxError) {
          console.error("Gemini response text that failed to parse:", responseText);
        }
        throw new Error("The AI service failed to optimize the route. Please try again.");
    }
}