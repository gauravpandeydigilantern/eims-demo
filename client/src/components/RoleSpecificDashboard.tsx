import TabbedDashboard from "./TabbedDashboard";

interface RoleSpecificDashboardProps {
  onDeviceSelect: (deviceId: string) => void;
}

export default function RoleSpecificDashboard({ onDeviceSelect }: RoleSpecificDashboardProps) {
  return <TabbedDashboard onDeviceSelect={onDeviceSelect} />;
}