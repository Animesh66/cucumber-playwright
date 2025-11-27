declare module 'multiple-cucumber-html-reporter' {
  interface Metadata {
    browser?: {
      name: string;
      version: string;
    };
    device?: string;
    platform?: {
      name: string;
      version: string;
    };
  }

  interface CustomDataItem {
    label: string;
    value: string;
  }

  interface CustomData {
    title: string;
    data: CustomDataItem[];
  }

  interface ReportOptions {
    jsonDir: string;
    reportPath: string;
    reportName?: string;
    pageTitle?: string;
    displayDuration?: boolean;
    displayReportTime?: boolean;
    metadata?: Metadata;
    customData?: CustomData;
  }

  export function generate(options: ReportOptions): void;
}
