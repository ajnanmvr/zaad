"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ParticularSuggestionsManager from "@/components/Settings/ParticularSuggestionsManager";

const ParticularSuggestionsPage = () => {
  return (
    <>
      <Breadcrumb pageName="Particular Suggestions" />
      <div className="mx-auto max-w-6xl">
        <ParticularSuggestionsManager />
      </div>
    </>
  );
};

export default ParticularSuggestionsPage;
