import { Tabs } from "expo-router";

export default function AgenceLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="projets" options={{ title: "Projets" }} />
      <Tabs.Screen name="chantier" options={{ title: "Chantier" }} />
      <Tabs.Screen name="paiements" options={{ title: "Paiements" }} />
      <Tabs.Screen name="colis" options={{ title: "Colis" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
    </Tabs>
  );
}
