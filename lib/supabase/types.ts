// Handgeschreven, op basis van supabase/01-schema.sql. Zodra je project live staat,
// vervang dit gerust door een gegenereerd bestand: `supabase gen types typescript`.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Pakket = "dwy" | "audit" | "templates" | "identity" | "zelf";
export type CourseStatus = "dicht" | "open" | "bezig" | "klaar";
export type DocStatus = "te-tekenen" | "getekend" | "info";
export type SkillStatus = "live" | "concept";
export type OfferStatus = "nieuw" | "interesse" | "weggeklikt";
export type RequestStatus = "nieuw" | "behandeling" | "afgerond";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; role: "admin" | "klant"; created_at: string };
        Insert: { id: string; role?: "admin" | "klant" };
        Update: { role?: "admin" | "klant" };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string | null;
          naam: string;
          bedrijf: string | null;
          email: string;
          pakket: Pakket;
          extras: string[];
          welkom: string | null;
          profiel: Json;
          geheugen: Json;
          merk: Json;
          werkplek: Json;
          platformen: string[];
          thema: Json;
          plan90: Json;
          toegang_tot: string | null;
          verlengd: boolean;
          limiet: Json | null;
          audit: Json | null;
          identiteit: Json | null;
          shoot: Json | null;
          checklist: Json;
          uitgenodigd: boolean;
          start: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          naam: string;
          email: string;
          pakket: Pakket;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      client_courses: {
        Row: {
          id: string;
          client_id: string;
          course: string;
          klaar_op: string | null;
          status: CourseStatus;
          notitie: string | null;
          skills: string[];
          volgorde: number;
        };
        Insert: Partial<Database["public"]["Tables"]["client_courses"]["Row"]> & {
          client_id: string;
          course: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_courses"]["Row"]>;
        Relationships: [];
      };
      files: {
        Row: {
          id: string;
          client_id: string;
          course: string;
          soort: "klaargezet" | "opgediend" | "upload";
          naam: string;
          storage_path: string | null;
          canva_url: string | null;
          onderdeel: string | null;
          grootte: number | null;
          notitie: string | null;
          downloads: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["files"]["Row"]> & {
          client_id: string;
          course: string;
          soort: "klaargezet" | "opgediend" | "upload";
          naam: string;
        };
        Update: Partial<Database["public"]["Tables"]["files"]["Row"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          titel: string;
          type: string;
          tekenen: boolean;
          status: DocStatus;
          storage_path: string | null;
          getekend_op: string | null;
          getekend_ip: string | null;
          created_at: string;
          template_id: string | null;
          versie: number | null;
          inhoud: string | null;
          getekend_naam: string | null;
          getekend_agent: string | null;
          getekend_hash: string | null;
          handtekening_path: string | null;
          pdf_path: string | null;
          volgorde: number;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          client_id: string;
          titel: string;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
        Relationships: [];
      };
      document_templates: {
        Row: {
          id: string;
          titel: string;
          type: string;
          tekenen: boolean;
          inhoud: string;
          pakketten: string[];
          extras: string[];
          automatisch: boolean;
          volgorde: number;
          versie: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["document_templates"]["Row"]> & { id: string; titel: string; type: string };
        Update: Partial<Database["public"]["Tables"]["document_templates"]["Row"]>;
        Relationships: [];
      };
      quiz_results: {
        Row: { client_id: string; antwoorden: Json; uitslag: "A" | "B" | "C" | "D"; created_at: string };
        Insert: { client_id: string; antwoorden: Json; uitslag: "A" | "B" | "C" | "D" };
        Update: Partial<Database["public"]["Tables"]["quiz_results"]["Row"]>;
        Relationships: [];
      };
      intake: {
        Row: { client_id: string; velden: Json; stap: number; klaar: boolean; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["intake"]["Row"]> & { client_id: string };
        Update: Partial<Database["public"]["Tables"]["intake"]["Row"]>;
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          client_id: string;
          titel: string;
          tekst: string;
          knop: string;
          trigger: string;
          actief: boolean;
          status: OfferStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["offers"]["Row"]> & {
          client_id: string;
          titel: string;
          tekst: string;
        };
        Update: Partial<Database["public"]["Tables"]["offers"]["Row"]>;
        Relationships: [];
      };
      activity: {
        Row: { id: number; client_id: string; type: string; tekst: string; gelezen: boolean; created_at: string };
        Insert: { client_id: string; type: string; tekst: string; gelezen?: boolean };
        Update: Partial<Database["public"]["Tables"]["activity"]["Row"]>;
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          naam: string;
          course: string;
          status: SkillStatus;
          wat: string | null;
          voorbeeld: string | null;
          kennis: string[];
          huidige_versie: number;
        };
        Insert: Partial<Database["public"]["Tables"]["skills"]["Row"]> & { id: string; naam: string; course: string };
        Update: Partial<Database["public"]["Tables"]["skills"]["Row"]>;
        Relationships: [];
      };
      skill_versions: {
        Row: { skill_id: string; versie: number; instructie: string; created_at: string };
        Insert: { skill_id: string; versie: number; instructie: string };
        Update: Partial<Database["public"]["Tables"]["skill_versions"]["Row"]>;
        Relationships: [];
      };
      client_taal: {
        Row: { client_id: string; concept: Json | null; live: Json | null; live_op: string | null };
        Insert: Partial<Database["public"]["Tables"]["client_taal"]["Row"]> & { client_id: string };
        Update: Partial<Database["public"]["Tables"]["client_taal"]["Row"]>;
        Relationships: [];
      };
      skill_runs: {
        Row: {
          id: string;
          client_id: string;
          skill_id: string;
          versie: number;
          input: string;
          output: string | null;
          tokens_in: number | null;
          tokens_out: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skill_runs"]["Row"]> & {
          client_id: string;
          skill_id: string;
          versie: number;
          input: string;
        };
        Update: Partial<Database["public"]["Tables"]["skill_runs"]["Row"]>;
        Relationships: [];
      };
      portal_settings: {
        Row: {
          id: number;
          welkom_kop: string;
          quotes: string[];
          foto_path: string | null;
          logo_licht_path: string | null;
          logo_donker_path: string | null;
          vragenlijst: Json;
          course_teksten: Json;
          beelden: Json;
          uitsnede: Json;
          kennis_auto: boolean;
          limieten: Json;
          handtekening_path: string | null;
          ondertekenaar: string;
          bedrijfsgegevens: string;
        };
        Insert: Partial<Database["public"]["Tables"]["portal_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["portal_settings"]["Row"]>;
        Relationships: [];
      };
      client_tools: {
        Row: {
          id: string;
          client_id: string;
          naam: string;
          doel: string;
          wanneer: string | null;
          invoer: string | null;
          uitvoer: string | null;
          voorbeeld: string | null;
          niet_doen: string | null;
          course: string | null;
          kanalen: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["client_tools"]["Row"]> & {
          client_id: string;
          naam: string;
          doel: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_tools"]["Row"]>;
        Relationships: [];
      };
      platform_knowledge: {
        Row: {
          platform: string;
          titel: string;
          live: string;
          bronnen: string[];
          bijgewerkt: string | null;
          concept: string | null;
          concept_bronnen: string[] | null;
          concept_op: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["platform_knowledge"]["Row"]> & {
          platform: string;
          titel: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_knowledge"]["Row"]>;
        Relationships: [];
      };
      todos: {
        Row: {
          id: string;
          client_id: string;
          titel: string;
          course: string | null;
          klaar: boolean;
          volgorde: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["todos"]["Row"]> & { client_id: string; titel: string };
        Update: Partial<Database["public"]["Tables"]["todos"]["Row"]>;
        Relationships: [];
      };
      requests: {
        Row: {
          id: string;
          client_id: string;
          soort: string;
          titel: string;
          toelichting: string | null;
          periode: string | null;
          status: RequestStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["requests"]["Row"]> & {
          client_id: string;
          soort: string;
          titel: string;
        };
        Update: Partial<Database["public"]["Tables"]["requests"]["Row"]>;
        Relationships: [];
      };
      chat_messages: {
        Row: { id: number; client_id: string; rol: "user" | "assistant"; tekst: string; created_at: string };
        Insert: { client_id: string; rol: "user" | "assistant"; tekst: string };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]>;
        Relationships: [];
      };
      knowledge: {
        Row: { id: string; titel: string; tekst: string; volgorde: number };
        Insert: Partial<Database["public"]["Tables"]["knowledge"]["Row"]> & { titel: string };
        Update: Partial<Database["public"]["Tables"]["knowledge"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    // De "gecontroleerde functies" uit 01-schema.sql (RLS laat geen vrije updates toe op clients/documents).
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      heeft_toegang: { Args: Record<string, never>; Returns: boolean };
      my_client_id: { Args: Record<string, never>; Returns: string };
      my_taal: { Args: Record<string, never>; Returns: Json };
      sign_document: { Args: { p_doc: string }; Returns: void };
      log_download: { Args: { p_file: string }; Returns: void };
      log_document_open: { Args: { p_doc: string }; Returns: void };
      documenten_klaarzetten: { Args: { p_client: string; p_template?: string | null }; Returns: number };
      sjabloon_doorvoeren: { Args: { p_template: string }; Returns: number };
      respond_offer: { Args: { p_offer: string; p_interesse: boolean }; Returns: void };
      toggle_todo: { Args: { p_todo: string; p_klaar: boolean }; Returns: void };
      complete_course: { Args: { p_course: string }; Returns: void };
      selectie_klaar: { Args: Record<string, never>; Returns: void };
      log_pixieset: { Args: { p_soort: string }; Returns: void };
      set_platformen: { Args: { p_platformen: string[] }; Returns: void };
      update_werkplek: {
        Args: {
          p_energietype: string;
          p_autoriteit: string;
          p_focus_minuten?: number;
          p_profiel?: string | null;
          p_hd?: Json | null;
          p_wis_hd?: boolean;
        };
        Returns: void;
      };
    };
  };
}

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientCourse = Database["public"]["Tables"]["client_courses"]["Row"];
export type FileRow = Database["public"]["Tables"]["files"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentTemplate = Database["public"]["Tables"]["document_templates"]["Row"];
export type SkillRow = Database["public"]["Tables"]["skills"]["Row"];
export type OfferRow = Database["public"]["Tables"]["offers"]["Row"];
export type ActivityRow = Database["public"]["Tables"]["activity"]["Row"];
