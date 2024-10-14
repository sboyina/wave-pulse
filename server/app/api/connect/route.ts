import { NextRequest } from "next/server";

export async function GET(
    request: NextRequest
  ) {
    const searchParams = request.nextUrl.searchParams;
    return Response.redirect(`${searchParams.get('appId')}://wavepulse/connect?url=${searchParams.get('wavepulseURL')}`);
}
