'use client';

import SiteFooter from '@/components/main/site-footer';
import SiteHeader from '@/components/main/site-header';

const FrontLayout = ({ children }: { children: React.ReactNode }) => {
  // shortcuts are registered globally in RootLayout
  return (
    <div className="min-h-screen">
      {/* <SiteHeader /> */}
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
};

export default FrontLayout;
