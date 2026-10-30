import React from "react";
import { Redirect } from "expo-router";

export default function CartRoute() {
  return <Redirect href="/(customer)/(tabs)/cart" />;
}
