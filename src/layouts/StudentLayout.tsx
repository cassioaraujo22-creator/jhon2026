import PremiumBottomNavigation from "@/components/PremiumBottomNavigation";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-28 overflow-y-auto">
        {children}
      </main>
      <PremiumBottomNavigation />
    </div>
  );
}
