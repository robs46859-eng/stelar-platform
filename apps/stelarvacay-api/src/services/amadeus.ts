import Amadeus from "amadeus";
import { config } from "../config.ts";

let amadeus: Amadeus | null = null;

if (config.amadeusClientId && config.amadeusClientSecret) {
  amadeus = new Amadeus({
    clientId: config.amadeusClientId,
    clientSecret: config.amadeusClientSecret,
  });
}

export async function getFlightPrice(origin: string, destination: string, date: string, adults: number) {
  if (!amadeus) return null;

  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: adults.toString(),
      max: "5",
      currencyCode: "INR",
    });

    if (response.data && response.data.length > 0) {
      // Return the cheapest price found
      return Math.round(parseFloat(response.data[0].price.total));
    }
    return null;
  } catch (error) {
    console.error("Amadeus flight search error:", error);
    return null;
  }
}

export async function getHotelPrice(cityCode: string, adults: number) {
  if (!amadeus) return null;

  try {
    // 1. Get list of hotels in the city
    const hotelListResponse = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode: cityCode,
    });

    if (!hotelListResponse.data || hotelListResponse.data.length === 0) return null;

    // 2. Get offers for the first few hotels (as a sample)
    const hotelIds = hotelListResponse.data.slice(0, 3).map((h: any) => h.hotelId).join(",");
    const offersResponse = await amadeus.shopping.hotelOffersSearch.get({
      hotelIds: hotelIds,
      adults: adults.toString(),
    });

    if (offersResponse.data && offersResponse.data.length > 0) {
      // Find the average price per night from the offers
      const prices = offersResponse.data.flatMap((h: any) =>
        h.offers.map((o: any) => parseFloat(o.price.total))
      );
      if (prices.length > 0) {
        return Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
      }
    }
    return null;
  } catch (error) {
    console.error("Amadeus hotel search error:", error);
    return null;
  }
}
