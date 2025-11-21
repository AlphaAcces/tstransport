export interface ViewModel<TProps = Record<string, unknown>> {
  /**
   * Raw subject identifier this view model represents (tsl, umit, etc.). Use for
   * logging, telemetry and cross-view linking.
   */
  subjectId: string;
  /**
   * Timestamp when the underlying data snapshot was generated. This enables
   * caching heuristics and PDF/export stamping without coupling to UI state.
   */
  generatedAt: string;
  /**
   * Fully derived props consumed by the presentation component.
   */
  props: TProps;
}
