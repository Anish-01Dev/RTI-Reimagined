import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CitizenShell } from "@/components/CitizenShell";
import { GovShell } from "@/components/GovShell";
import { loadDemoWorkspace } from "@/domain/seed";
import { isDemoSession } from "@/lib/demoIdentity";

import { LandingPage } from "@/pages/marketing/LandingPage";
import { HowItWorksPage } from "@/pages/marketing/HowItWorksPage";
import { WhySuchnaPage } from "@/pages/marketing/WhySuchnaPage";
import { UnkillableRtiPage } from "@/pages/marketing/UnkillableRtiPage";
import { PublicLegalPage } from "@/pages/marketing/PublicLegalPage";
import { LoginPage } from "@/pages/LoginPage";
import { EvidenceVerifyPage } from "@/pages/EvidenceVerifyPage";

import { CitizenOverviewPage } from "@/pages/citizen/OverviewPage";
import { CreateCasePage } from "@/pages/citizen/CreateCasePage";
import { ApplicationDoctorPage } from "@/pages/citizen/ApplicationDoctorPage";
import { MyCasesPage } from "@/pages/citizen/MyCasesPage";
import { DeadlinesPage } from "@/pages/citizen/DeadlinesPage";
import { TrailsPage } from "@/pages/citizen/TrailsPage";
import { DocumentsPage } from "@/pages/citizen/DocumentsPage";
import { LegalReferencePage } from "@/pages/citizen/LegalReferencePage";
import { NotificationsPage } from "@/pages/citizen/NotificationsPage";
import { HelpPage } from "@/pages/citizen/HelpPage";
import { SettingsPage } from "@/pages/citizen/SettingsPage";
import { CaseWorkspaceLayout } from "@/pages/citizen/CaseWorkspaceLayout";
import { CaseOverviewTab } from "@/pages/citizen/tabs/CaseOverviewTab";
import { CaseTimelineTab } from "@/pages/citizen/tabs/CaseTimelineTab";
import { CaseEvidenceTab } from "@/pages/citizen/tabs/CaseEvidenceTab";
import { CasePassportTab } from "@/pages/citizen/tabs/CasePassportTab";
import { CaseLegalTab } from "@/pages/citizen/tabs/CaseLegalTab";
import { CaseActivityTab } from "@/pages/citizen/tabs/CaseActionsTab";

import { GovOperationsPage } from "@/pages/gov/OperationsPage";
import { GovCaseQueuePage } from "@/pages/gov/CaseQueuePage";
import { ResponseReviewPage } from "@/pages/gov/ResponseReviewPage";
import { GovDeadlinesPage } from "@/pages/gov/GovDeadlinesPage";
import { GovAppealsPage } from "@/pages/gov/GovAppealsPage";
import { AuthoritiesPage } from "@/pages/gov/AuthoritiesPage";
import { AnalyticsPage } from "@/pages/gov/AnalyticsPage";
import { CoveragePage } from "@/pages/gov/CoveragePage";
import { GlobalAuditPage } from "@/pages/gov/GlobalAuditPage";
import { GovHelpPage } from "@/pages/gov/GovHelpPage";
import { GovCaseWorkspaceLayout } from "@/pages/gov/GovCaseWorkspaceLayout";
import { GovOverviewTab } from "@/pages/gov/tabs/GovOverviewTab";
import { GovDocumentsTab } from "@/pages/gov/tabs/GovDocumentsTab";
import { GovResponseTab } from "@/pages/gov/tabs/GovResponseTab";
import { GovTimelineTab } from "@/pages/gov/tabs/GovTimelineTab";
import { GovLegalTab } from "@/pages/gov/tabs/GovLegalTab";
import { GovAuditTab } from "@/pages/gov/tabs/GovAuditTab";

function App() {
  useEffect(() => {
    if (isDemoSession()) void loadDemoWorkspace();
  }, []);

  return (
    <I18nProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/why-suchna" element={<WhySuchnaPage />} />
          <Route path="/unkillable-rti" element={<UnkillableRtiPage />} />
          <Route path="/legal" element={<PublicLegalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify/:id" element={<EvidenceVerifyPage />} />

          <Route element={<ProtectedRoute role="CITIZEN" />}>
            <Route path="/app" element={<CitizenShell />}>
              <Route index element={<CitizenOverviewPage />} />
              <Route path="create" element={<CreateCasePage />} />
              <Route path="doctor" element={<ApplicationDoctorPage />} />
              <Route path="cases" element={<MyCasesPage />} />
              <Route path="deadlines" element={<DeadlinesPage />} />
              <Route path="trails" element={<TrailsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="legal" element={<LegalReferencePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="cases/:id" element={<CaseWorkspaceLayout />}>
                <Route index element={<CaseOverviewTab />} />
                <Route path="timeline" element={<CaseTimelineTab />} />
                <Route path="evidence" element={<CaseEvidenceTab />} />
                <Route path="trail" element={<CasePassportTab />} />
                <Route path="legal" element={<CaseLegalTab />} />
                <Route path="activity" element={<CaseActivityTab />} />
              </Route>
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="GOVERNMENT_OFFICIAL" />}>
            <Route path="/gov" element={<GovShell />}>
              <Route index element={<GovOperationsPage />} />
              <Route path="cases" element={<GovCaseQueuePage />} />
              <Route path="response" element={<ResponseReviewPage />} />
              <Route path="deadlines" element={<GovDeadlinesPage />} />
              <Route path="appeals" element={<GovAppealsPage />} />
              <Route path="authorities" element={<AuthoritiesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="coverage" element={<CoveragePage />} />
              <Route path="audit" element={<GlobalAuditPage />} />
              <Route path="help" element={<GovHelpPage />} />
              <Route path="cases/:id" element={<GovCaseWorkspaceLayout />}>
                <Route index element={<GovOverviewTab />} />
                <Route path="documents" element={<GovDocumentsTab />} />
                <Route path="response" element={<GovResponseTab />} />
                <Route path="timeline" element={<GovTimelineTab />} />
                <Route path="legal" element={<GovLegalTab />} />
                <Route path="audit" element={<GovAuditTab />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </ErrorBoundary>
    </I18nProvider>
  );
}

export default App;
