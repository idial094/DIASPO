import { Tabs } from "expo-router";

export default function DiasporaLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="paiements" options={{ title: "Paiements" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="documents" options={{ title: "Documents" }} />
      <Tabs.Screen name="colis" options={{ title: "Colis" }} />
    </Tabs>
  );
}
