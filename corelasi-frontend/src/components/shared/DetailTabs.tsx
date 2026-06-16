import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface DetailTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChangeTab: (id: string) => void;
  className?: string;
}

export const DetailTabs: React.FC<DetailTabsProps> = ({
  tabs,
  activeTab,
  onChangeTab,
  className = "",
}) => {
  return (
    <div className={`border-b border-bg-border ${className}`}>
      <div className="flex gap-4">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-2 pb-2.5 pt-1.5 px-1 text-[13px] font-semibold border-b-2 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-[2px] cursor-pointer
                ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-bg-ink-secondary hover:text-bg-ink hover:border-bg-border-muted"
                }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
