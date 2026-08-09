'use client';

// import SiteFooter from '@/components/layout/site-footer';
// import SiteHeader from '@/components/layout/site-header';

const FrontLayout = ({ children }: { children: React.ReactNode }) => {
  // shortcuts are registered globally in RootLayout
  return (
    <div className="min-h-screen">
      {/* <SiteHeader /> */}
      <main>{children}</main>
      {/* <SiteFooter /> */}
    </div>
  );
};

export default FrontLayout;
