import React from 'react';
import Sidebar from '../components/Sidebar';
import FuturisticSmartCampus from '../components/FuturisticSmartCampus';

const FuturisticPage = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <FuturisticSmartCampus />
      </main>
    </div>
  );
};

export default FuturisticPage;
