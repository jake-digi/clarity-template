import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy, Check, Key, Database, Code2,
  Plus, Trash2, AlertTriangle, Play, FileText,
  RefreshCw, Clock, Send, ChevronDown, ChevronRight, Download, Shield, X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const API_INTERNAL_URL = `${SUPABASE_URL}/functions/v1/api-gateway`;
// Public, documented base URL (goes via Vercel rewrite to the edge function)
const API_BASE_URL = "https://checkpoint.jlgb.org/api/v1";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  allowed_ips: string[];
}

interface ApiLog {
  id: string;
  key_prefix: string | null;
  method: string;
  path: string;
  status_code: number;
  request_body: unknown;
  response_body: unknown;
  response_time_ms: number;
  ip_address: string | null;
  user_agent: string | null;
  error_message: string | null;
  created_at: string;
}

const methodColor: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PATCH: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusColor = (code: number) => {
  if (code >= 200 && code < 300) return "text-emerald-600";
  if (code >= 400 && code < 500) return "text-amber-600";
  return "text-destructive";
};

// ── Endpoint data ──
const endpointGroups = [
  {
    title: "Health",
    description: "Public health check endpoint. No authentication required.",
    endpoints: [
      { method: "GET", path: "/health", description: "Health check — returns API status and timestamp", exampleResponse: `{\n  "success": true,\n  "status": "healthy",\n  "timestamp": "2026-03-16T10:47:39.902Z"\n}`, },
    ],
  },
  {
    title: "Instances",
    description: "Supports ?type=dofe or ?type=standard filtering.",
    endpoints: [
      { method: "GET", path: "/instances", description: "List all instances",
        exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "INS-2026-3658",\n      "tenant_id": "KettleOrganisation",\n      "name": "test",\n      "description": null,\n      "status": "completed",\n      "start_date": "2026-02-12",\n      "end_date": "2026-02-12",\n      "location": null,\n      "owner_id": "6cf5bce2-a132-43df-857b-d18fad103897",\n      "settings": {\n        "code": "INS-2026-3658",\n        "type": "dofe",\n        "level": "Bronze",\n        "capacity": "",\n        "expeditionType": "Walking",\n        "assigned_trackers": ["b01", "b02", "b03", "b04"]\n      },\n      "created_at": "2026-02-05T19:25:15.765",\n      "updated_at": "2026-02-05T23:22:14.139",\n      "deleted_at": null,\n      "site_id": null,\n      "type": "standard",\n      "dofe_level": null,\n      "expedition_type": "Walking"\n    }\n  ],\n  "meta": {\n    "total": 14,\n    "limit": 1,\n    "offset": 0\n  }\n}` },
      { method: "GET", path: "/instances/:id", description: "Get instance by ID",
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "INS-2026-3658",\n    "tenant_id": "KettleOrganisation",\n    "name": "test",\n    "description": null,\n    "status": "completed",\n    "start_date": "2026-02-12",\n    "end_date": "2026-02-12",\n    "location": null,\n    "owner_id": "6cf5bce2-a132-43df-857b-d18fad103897",\n    "settings": {\n      "code": "INS-2026-3658",\n      "type": "dofe",\n      "level": "Bronze",\n      "capacity": "",\n      "expeditionType": "Walking",\n      "assigned_trackers": ["b01", "b02", "b03", "b04"]\n    },\n    "created_at": "2026-02-05T19:25:15.765",\n    "updated_at": "2026-02-05T23:22:14.139",\n    "deleted_at": null,\n    "site_id": null,\n    "type": "standard",\n    "dofe_level": null,\n    "expedition_type": "Walking"\n  }\n}` },
      { method: "POST", path: "/instances", description: "Create instance",
        exampleBody: `{\n  "name": "API Docs Test Instance",\n  "start_date": "2026-06-01",\n  "end_date": "2026-06-07",\n  "location": "Peak District",\n  "type": "dofe"\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "684dcb5d-f9d4-4116-b4bd-8f8e34831d5a",\n    "tenant_id": "KettleOrganisation",\n    "name": "API Docs Test Instance",\n    "description": null,\n    "status": "upcoming",\n    "start_date": "2026-06-01",\n    "end_date": "2026-06-07",\n    "location": "Peak District",\n    "owner_id": null,\n    "settings": {\n      "instanceType": "dofe"\n    },\n    "created_at": "2026-03-16T11:01:35.6179",\n    "updated_at": "2026-03-16T11:01:35.6179",\n    "deleted_at": null,\n    "site_id": null,\n    "type": "dofe",\n    "dofe_level": null,\n    "expedition_type": null\n  }\n}` },
      { method: "PATCH", path: "/instances/:id", description: "Update instance",
        exampleBody: `{\n  "name": "API Docs Test Instance (Updated)",\n  "status": "active"\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "684dcb5d-f9d4-4116-b4bd-8f8e34831d5a",\n    "tenant_id": "KettleOrganisation",\n    "name": "API Docs Test Instance (Updated)",\n    "description": null,\n    "status": "active",\n    "start_date": "2026-06-01",\n    "end_date": "2026-06-07",\n    "location": "Peak District",\n    "owner_id": null,\n    "settings": {\n      "instanceType": "dofe"\n    },\n    "created_at": "2026-03-16T11:01:35.6179",\n    "updated_at": "2026-03-16T11:01:35.6179",\n    "deleted_at": null,\n    "site_id": null,\n    "type": "dofe",\n    "dofe_level": null,\n    "expedition_type": null\n  }\n}` },
      { method: "DELETE", path: "/instances/:id", description: "Soft-delete instance",
        exampleResponse: `{\n  "success": true\n}` },
    ],
  },
  {
    title: "Participant Assignments",
    description: "Manage participant-to-instance assignments.",
    endpoints: [
      { method: "GET", path: "/instances/:instanceId/participants", description: "List participants assigned to instance",
        exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "1ef24860-a8e5-4899-823c-29bcbba962d0",\n      "participant_id": "24600",\n      "instance_id": "435NDwI1vIXcCIOSnFuQ",\n      "super_group_id": "fbA7pHMRlOmFIoBbO5k6",\n      "sub_group_id": "5GsHYwfI0hhsgg8SqYKr",\n      "block_id": "dTaMQpjZguej0IrcYgnX",\n      "room_id": "sGUJ3AG5nhdcDtbj88Bb",\n      "room_number": "17",\n      "is_off_site": false,\n      "off_site_comment": null,\n      "arrival_date": "2025-03-08T00:00:00+00:00",\n      "departure_date": "2025-10-08T00:00:00+00:00",\n      "created_at": "2026-02-05T19:02:07.703218+00:00",\n      "updated_at": "2026-02-05T19:02:07.703218+00:00",\n      "participants": {\n        "id": "24600",\n        "rank": "Overs",\n        "gender": "Male",\n        "status": "active",\n        "room_id": "sGUJ3AG5nhdcDtbj88Bb",\n        "surname": "Cook",\n        "user_id": "24600",\n        "block_id": "dTaMQpjZguej0IrcYgnX",\n        "pronouns": null,\n        "full_name": "Miles Cook",\n        "tenant_id": "KettleOrganisation",\n        "unit_name": "UK",\n        "case_flags": [],\n        "created_at": "2025-08-03T17:35:46.465",\n        "first_name": "Miles",\n        "light_load": false,\n        "photo_link": "24600",\n        "updated_at": "2025-08-06T22:49:00.817",\n        "instance_id": "435NDwI1vIXcCIOSnFuQ",\n        "is_off_site": false,\n        "room_number": "17",\n        "school_year": "9",\n        "arrival_date": "2025-03-08T00:00:00",\n        "sub_group_id": "5GsHYwfI0hhsgg8SqYKr",\n        "date_of_birth": null,\n        "departure_date": "2025-10-08T00:00:00",\n        "super_group_id": "fbA7pHMRlOmFIoBbO5k6",\n        "active_case_ids": [],\n        "last_case_update": null,\n        "off_site_comment": null,\n        "school_institute": "King Solomon High School",\n        "current_strike_count": 0,\n        "has_active_welfare_case": false,\n        "has_active_behavior_case": false,\n        "requires_welfare_check_in": false\n      }\n    }\n  ],\n  "meta": {\n    "total": 459,\n    "limit": 1,\n    "offset": 0\n  }\n}` },
      { method: "GET", path: "/instances/:instanceId/participants/:assignmentId", description: "Get assignment by ID",
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "1ef24860-a8e5-4899-823c-29bcbba962d0",\n    "participant_id": "24600",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "super_group_id": "fbA7pHMRlOmFIoBbO5k6",\n    "sub_group_id": "5GsHYwfI0hhsgg8SqYKr",\n    "block_id": "dTaMQpjZguej0IrcYgnX",\n    "room_id": "sGUJ3AG5nhdcDtbj88Bb",\n    "room_number": "17",\n    "is_off_site": false,\n    "off_site_comment": null,\n    "arrival_date": "2025-03-08T00:00:00+00:00",\n    "departure_date": "2025-10-08T00:00:00+00:00",\n    "created_at": "2026-02-05T19:02:07.703218+00:00",\n    "updated_at": "2026-02-05T19:02:07.703218+00:00",\n    "participants": {\n      "id": "24600",\n      "rank": "Overs",\n      "gender": "Male",\n      "status": "active",\n      "room_id": "sGUJ3AG5nhdcDtbj88Bb",\n      "surname": "Cook",\n      "user_id": "24600",\n      "block_id": "dTaMQpjZguej0IrcYgnX",\n      "pronouns": null,\n      "full_name": "Miles Cook",\n      "tenant_id": "KettleOrganisation",\n      "unit_name": "UK",\n      "case_flags": [],\n      "created_at": "2025-08-03T17:35:46.465",\n      "first_name": "Miles",\n      "light_load": false,\n      "photo_link": "24600",\n      "updated_at": "2025-08-06T22:49:00.817",\n      "instance_id": "435NDwI1vIXcCIOSnFuQ",\n      "is_off_site": false,\n      "room_number": "17",\n      "school_year": "9",\n      "arrival_date": "2025-03-08T00:00:00",\n      "sub_group_id": "5GsHYwfI0hhsgg8SqYKr",\n      "date_of_birth": null,\n      "departure_date": "2025-10-08T00:00:00",\n      "super_group_id": "fbA7pHMRlOmFIoBbO5k6",\n      "active_case_ids": [],\n      "last_case_update": null,\n      "off_site_comment": null,\n      "school_institute": "King Solomon High School",\n      "current_strike_count": 0,\n      "has_active_welfare_case": false,\n      "has_active_behavior_case": false,\n      "requires_welfare_check_in": false\n    }\n  }\n}` },
      { method: "POST", path: "/instances/:instanceId/participants", description: "Assign participant to instance",
        exampleBody: `{\n  "participant_id": "7896a24a-d42b-4541-bfe7-46edc64fce90",\n  "super_group_id": "f121328d-3331-43f6-9a3b-f8ef06333d11",\n  "arrival_date": "2026-06-01T10:00:00Z",\n  "departure_date": "2026-06-07T16:00:00Z"\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "c67ed915-6c4e-44e3-a24f-d6cc4577e8b4",\n    "participant_id": "7896a24a-d42b-4541-bfe7-46edc64fce90",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "super_group_id": "f121328d-3331-43f6-9a3b-f8ef06333d11",\n    "sub_group_id": null,\n    "block_id": null,\n    "room_id": null,\n    "room_number": null,\n    "is_off_site": false,\n    "off_site_comment": null,\n    "arrival_date": "2026-06-01T10:00:00+00:00",\n    "departure_date": "2026-06-07T16:00:00+00:00",\n    "created_at": "2026-03-16T10:57:08.944772+00:00",\n    "updated_at": "2026-03-16T10:57:08.944772+00:00",\n    "participants": {\n      "id": "7896a24a-d42b-4541-bfe7-46edc64fce90",\n      "rank": "Seniors",\n      "gender": "Male",\n      "status": "active",\n      "room_id": null,\n      "surname": "TestUser",\n      "user_id": null,\n      "block_id": null,\n      "pronouns": null,\n      "full_name": "API TestUser",\n      "tenant_id": "KettleOrganisation",\n      "unit_name": "Test Unit",\n      "case_flags": [],\n      "created_at": "2026-03-16T10:56:50.389095",\n      "first_name": "API",\n      "light_load": false,\n      "photo_link": null,\n      "updated_at": "2026-03-16T10:56:50.389095",\n      "instance_id": null,\n      "is_off_site": false,\n      "room_number": null,\n      "school_year": "10",\n      "arrival_date": null,\n      "sub_group_id": null,\n      "date_of_birth": "2008-01-01",\n      "departure_date": null,\n      "super_group_id": null,\n      "active_case_ids": [],\n      "last_case_update": null,\n      "off_site_comment": null,\n      "school_institute": null,\n      "current_strike_count": 0,\n      "has_active_welfare_case": false,\n      "has_active_behavior_case": false,\n      "requires_welfare_check_in": false\n    }\n  }\n}` },
      { method: "PATCH", path: "/instances/:instanceId/participants/:assignmentId", description: "Update assignment (room, group, off-site)",
        exampleBody: `{\n  "room_id": "6d5360f5-bdb8-4b28-a763-69e5919c1858",\n  "room_number": "999",\n  "is_off_site": false\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "c67ed915-6c4e-44e3-a24f-d6cc4577e8b4",\n    "participant_id": "7896a24a-d42b-4541-bfe7-46edc64fce90",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "super_group_id": "f121328d-3331-43f6-9a3b-f8ef06333d11",\n    "sub_group_id": null,\n    "block_id": null,\n    "room_id": "6d5360f5-bdb8-4b28-a763-69e5919c1858",\n    "room_number": "999",\n    "is_off_site": false,\n    "off_site_comment": null,\n    "arrival_date": "2026-06-01T10:00:00+00:00",\n    "departure_date": "2026-06-07T16:00:00+00:00",\n    "created_at": "2026-03-16T10:57:08.944772+00:00",\n    "updated_at": "2026-03-16T10:57:08.944772+00:00",\n    "participants": {\n      "id": "7896a24a-d42b-4541-bfe7-46edc64fce90",\n      "full_name": "API TestUser",\n      "first_name": "API",\n      "surname": "TestUser",\n      "status": "active",\n      "rank": "Seniors",\n      "school_year": "11",\n      "school_institute": "Test Academy",\n      "gender": "Male",\n      "tenant_id": "KettleOrganisation"\n    }\n  }\n}` },
      { method: "DELETE", path: "/instances/:instanceId/participants/:assignmentId", description: "Remove participant from instance",
        exampleResponse: `{\n  "success": true\n}` },
    ],
  },
  {
    title: "Participants (Global)",
    description: "Global participant records.",
    endpoints: [
      { method: "GET", path: "/participants", description: "List participants (?instance_id=)",
        exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "24600",\n      "user_id": "24600",\n      "first_name": "Miles",\n      "surname": "Cook",\n      "full_name": "Miles Cook",\n      "date_of_birth": null,\n      "gender": "Male",\n      "pronouns": null,\n      "rank": "Overs",\n      "status": "active",\n      "school_year": "9",\n      "school_institute": "King Solomon High School",\n      "unit_name": "UK",\n      "tenant_id": "KettleOrganisation",\n      "instance_id": "435NDwI1vIXcCIOSnFuQ",\n      "arrival_date": "2025-03-08T00:00:00",\n      "departure_date": "2025-10-08T00:00:00",\n      "is_off_site": false,\n      "off_site_comment": null,\n      "super_group_id": "fbA7pHMRlOmFIoBbO5k6",\n      "sub_group_id": "5GsHYwfI0hhsgg8SqYKr",\n      "block_id": "dTaMQpjZguej0IrcYgnX",\n      "room_id": "sGUJ3AG5nhdcDtbj88Bb",\n      "room_number": "17",\n      "photo_link": "24600",\n      "created_at": "2025-08-03T17:35:46.465",\n      "updated_at": "2025-08-06T22:49:00.817",\n      "light_load": false,\n      "active_case_ids": [],\n      "has_active_behavior_case": false,\n      "has_active_welfare_case": false,\n      "current_strike_count": 0,\n      "case_flags": [],\n      "last_case_update": null,\n      "requires_welfare_check_in": false\n    }\n  ],\n  "meta": {\n    "total": 1160,\n    "limit": 1,\n    "offset": 0\n  }\n}` },
      { method: "GET", path: "/participants/:id", description: "Get participant by ID",
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "24600",\n    "user_id": "24600",\n    "first_name": "Miles",\n    "surname": "Cook",\n    "full_name": "Miles Cook",\n    "date_of_birth": null,\n    "gender": "Male",\n    "pronouns": null,\n    "rank": "Overs",\n    "status": "active",\n    "school_year": "9",\n    "school_institute": "King Solomon High School",\n    "unit_name": "UK",\n    "tenant_id": "KettleOrganisation",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "arrival_date": "2025-03-08T00:00:00",\n    "departure_date": "2025-10-08T00:00:00",\n    "is_off_site": false,\n    "off_site_comment": null,\n    "super_group_id": "fbA7pHMRlOmFIoBbO5k6",\n    "sub_group_id": "5GsHYwfI0hhsgg8SqYKr",\n    "block_id": "dTaMQpjZguej0IrcYgnX",\n    "room_id": "sGUJ3AG5nhdcDtbj88Bb",\n    "room_number": "17",\n    "photo_link": "24600",\n    "created_at": "2025-08-03T17:35:46.465",\n    "updated_at": "2025-08-06T22:49:00.817",\n    "light_load": false,\n    "active_case_ids": [],\n    "has_active_behavior_case": false,\n    "has_active_welfare_case": false,\n    "current_strike_count": 0,\n    "case_flags": [],\n    "last_case_update": null,\n    "requires_welfare_check_in": false\n  }\n}` },
      { method: "POST", path: "/participants", description: "Create participant",
        exampleBody: `{\n  "first_name": "API",\n  "surname": "TestUser",\n  "date_of_birth": "2008-01-01",\n  "gender": "Male",\n  "school_year": "10",\n  "rank": "Seniors",\n  "unit_name": "Test Unit"\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "7896a24a-d42b-4541-bfe7-46edc64fce90",\n    "user_id": null,\n    "first_name": "API",\n    "surname": "TestUser",\n    "full_name": "API TestUser",\n    "date_of_birth": "2008-01-01",\n    "gender": "Male",\n    "pronouns": null,\n    "rank": "Seniors",\n    "status": "active",\n    "school_year": "10",\n    "school_institute": null,\n    "unit_name": "Test Unit",\n    "tenant_id": "KettleOrganisation",\n    "instance_id": null,\n    "arrival_date": null,\n    "departure_date": null,\n    "is_off_site": false,\n    "off_site_comment": null,\n    "super_group_id": null,\n    "sub_group_id": null,\n    "block_id": null,\n    "room_id": null,\n    "room_number": null,\n    "photo_link": null,\n    "created_at": "2026-03-16T10:56:50.389095",\n    "updated_at": "2026-03-16T10:56:50.389095",\n    "light_load": false,\n    "active_case_ids": [],\n    "has_active_behavior_case": false,\n    "has_active_welfare_case": false,\n    "current_strike_count": 0,\n    "case_flags": [],\n    "last_case_update": null,\n    "requires_welfare_check_in": false\n  }\n}` },
      { method: "PATCH", path: "/participants/:id", description: "Update participant",
        exampleBody: `{\n  "school_year": "11",\n  "rank": "Seniors",\n  "school_institute": "Test Academy"\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "7896a24a-d42b-4541-bfe7-46edc64fce90",\n    "user_id": null,\n    "first_name": "API",\n    "surname": "TestUser",\n    "full_name": "API TestUser",\n    "date_of_birth": "2008-01-01",\n    "gender": "Male",\n    "pronouns": null,\n    "rank": "Seniors",\n    "status": "active",\n    "school_year": "11",\n    "school_institute": "Test Academy",\n    "unit_name": "Test Unit",\n    "tenant_id": "KettleOrganisation",\n    "instance_id": null,\n    "arrival_date": null,\n    "departure_date": null,\n    "is_off_site": false,\n    "off_site_comment": null,\n    "super_group_id": null,\n    "sub_group_id": null,\n    "block_id": null,\n    "room_id": null,\n    "room_number": null,\n    "photo_link": null,\n    "created_at": "2026-03-16T10:56:50.389095",\n    "updated_at": "2026-03-16T10:56:50.389095",\n    "light_load": false,\n    "active_case_ids": [],\n    "has_active_behavior_case": false,\n    "has_active_welfare_case": false,\n    "current_strike_count": 0,\n    "case_flags": [],\n    "last_case_update": null,\n    "requires_welfare_check_in": false\n  }\n}` },
      { method: "DELETE", path: "/participants/:id", description: "Delete participant (note: requires DB-level delete permission)",
        exampleResponse: `{\n  "success": true\n}` },
    ],
  },
  {
    title: "Supergroups",
    description: "Instance-scoped. Deleting cascades to subgroups.",
    endpoints: [
      { method: "GET", path: "/instances/:instanceId/supergroups", description: "List supergroups for instance",
        exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "88lhZMucgxNbpK9GkelY",\n      "name": "Realm of Wonder",\n      "description": "Auto-created supergroup: Realm of Wonder",\n      "type": "staff",\n      "purpose": "general",\n      "notifications": true,\n      "instance_id": "435NDwI1vIXcCIOSnFuQ",\n      "tenant_id": "KettleOrganisation",\n      "created_at": "2025-08-03T17:35:46.453",\n      "updated_at": "2025-08-03T17:35:46.453",\n      "deleted_at": null\n    }\n  ],\n  "meta": {\n    "total": 5,\n    "limit": 1,\n    "offset": 0\n  }\n}` },
      { method: "GET", path: "/instances/:instanceId/supergroups/:sgId", description: "Get supergroup by ID",
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "88lhZMucgxNbpK9GkelY",\n    "name": "Realm of Wonder",\n    "description": "Auto-created supergroup: Realm of Wonder",\n    "type": "staff",\n    "purpose": "general",\n    "notifications": true,\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2025-08-03T17:35:46.453",\n    "updated_at": "2025-08-03T17:35:46.453",\n    "deleted_at": null\n  }\n}` },
      { method: "POST", path: "/instances/:instanceId/supergroups", description: "Create supergroup",
        exampleBody: `{\n  "name": "API Test House",\n  "description": "Test supergroup for API docs",\n  "type": "participant",\n  "purpose": "general",\n  "notifications": true\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "f121328d-3331-43f6-9a3b-f8ef06333d11",\n    "name": "API Test House",\n    "description": "Test supergroup for API docs",\n    "type": "participant",\n    "purpose": "general",\n    "notifications": true,\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2026-03-16T10:56:54.692114",\n    "updated_at": "2026-03-16T10:56:54.692114",\n    "deleted_at": null\n  }\n}` },
      { method: "PATCH", path: "/instances/:instanceId/supergroups/:sgId", description: "Update supergroup",
        exampleBody: `{\n  "name": "API Test House (Updated)"\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "f121328d-3331-43f6-9a3b-f8ef06333d11",\n    "name": "API Test House (Updated)",\n    "description": "Test supergroup for API docs",\n    "type": "participant",\n    "purpose": "general",\n    "notifications": true,\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2026-03-16T10:56:54.692114",\n    "updated_at": "2026-03-16T10:56:54.692114",\n    "deleted_at": null\n  }\n}` },
      { method: "DELETE", path: "/instances/:instanceId/supergroups/:sgId", description: "Soft-delete supergroup",
        exampleResponse: `{\n  "success": true\n}` },
    ],
  },
  {
    title: "Subgroups",
    description: "Nested under supergroups within an instance.",
    endpoints: [
      { method: "GET", path: "/instances/:instanceId/supergroups/:sgId/subgroups", description: "List subgroups",
        exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "5U6smhNoDXbd4QSMbcu4",\n      "name": "Unicorn",\n      "description": "Auto-created subgroup: Unicorn",\n      "type": "staff",\n      "purpose": "general",\n      "notifications": true,\n      "parent_supergroup_id": "88lhZMucgxNbpK9GkelY",\n      "instance_id": "435NDwI1vIXcCIOSnFuQ",\n      "tenant_id": "KettleOrganisation",\n      "created_at": "2025-08-03T17:35:46.453",\n      "updated_at": "2025-08-03T17:35:46.453",\n      "deleted_at": null,\n      "tracker_name": null,\n      "hardware_id": null,\n      "route_id": null,\n      "last_activity_at": null,\n      "is_vehicle": false\n    }\n  ],\n  "meta": {\n    "total": 104,\n    "limit": 1,\n    "offset": 0\n  }\n}` },
      { method: "GET", path: "/instances/:instanceId/supergroups/:sgId/subgroups/:subId", description: "Get subgroup by ID",
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "5U6smhNoDXbd4QSMbcu4",\n    "name": "Unicorn",\n    "description": "Auto-created subgroup: Unicorn",\n    "type": "staff",\n    "purpose": "general",\n    "notifications": true,\n    "parent_supergroup_id": "88lhZMucgxNbpK9GkelY",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2025-08-03T17:35:46.453",\n    "updated_at": "2025-08-03T17:35:46.453",\n    "deleted_at": null,\n    "tracker_name": null,\n    "hardware_id": null,\n    "route_id": null,\n    "last_activity_at": null,\n    "is_vehicle": false\n  }\n}` },
      { method: "POST", path: "/instances/:instanceId/supergroups/:sgId/subgroups", description: "Create subgroup",
        exampleBody: `{\n  "name": "API Test Subgroup",\n  "description": "Test subgroup for API docs",\n  "type": "participant",\n  "notifications": true\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "cc53127a-5b30-4b77-be37-85c610025f07",\n    "name": "API Test Subgroup",\n    "description": "Test subgroup for API docs",\n    "type": "participant",\n    "purpose": null,\n    "notifications": true,\n    "parent_supergroup_id": "08e72872-591f-4de8-8aae-58f4728f8c2d",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2026-03-16T11:01:49.587717",\n    "updated_at": "2026-03-16T11:01:49.587717",\n    "deleted_at": null,\n    "tracker_name": null,\n    "hardware_id": null,\n    "route_id": null,\n    "last_activity_at": null,\n    "is_vehicle": false\n  }\n}` },
      { method: "PATCH", path: "/instances/:instanceId/supergroups/:sgId/subgroups/:subId", description: "Update subgroup",
        exampleBody: `{\n  "name": "API Test Subgroup (Updated)"\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "cc53127a-5b30-4b77-be37-85c610025f07",\n    "name": "API Test Subgroup (Updated)",\n    "description": "Test subgroup for API docs",\n    "type": "participant",\n    "purpose": null,\n    "notifications": true,\n    "parent_supergroup_id": "08e72872-591f-4de8-8aae-58f4728f8c2d",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2026-03-16T11:01:49.587717",\n    "updated_at": "2026-03-16T11:01:49.587717",\n    "deleted_at": null,\n    "tracker_name": null,\n    "hardware_id": null,\n    "route_id": null,\n    "last_activity_at": null,\n    "is_vehicle": false\n  }\n}` },
      { method: "DELETE", path: "/instances/:instanceId/supergroups/:sgId/subgroups/:subId", description: "Soft-delete subgroup",
        exampleResponse: `{\n  "success": true\n}` },
    ],
  },
  {
    title: "Blocks",
    description: "Filter with ?instance_id= or ?site_id=. Soft-delete.",
    endpoints: [
      { method: "GET", path: "/blocks", description: "List blocks (?instance_id=, ?site_id=)",
        exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "4zPD9247496iZuFnYGLj",\n      "name": "Village 2",\n      "description": "Auto-created block: Village 2",\n      "instance_id": "435NDwI1vIXcCIOSnFuQ",\n      "tenant_id": "KettleOrganisation",\n      "created_at": "2025-08-03T17:35:46.453",\n      "updated_at": "2025-08-03T17:35:46.453",\n      "deleted_at": null,\n      "site_id": null,\n      "geo_polygon": null\n    }\n  ],\n  "meta": {\n    "total": 37,\n    "limit": 1,\n    "offset": 0\n  }\n}` },
      { method: "GET", path: "/blocks/:blockId", description: "Get block by ID",
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "4zPD9247496iZuFnYGLj",\n    "name": "Village 2",\n    "description": "Auto-created block: Village 2",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2025-08-03T17:35:46.453",\n    "updated_at": "2025-08-03T17:35:46.453",\n    "deleted_at": null,\n    "site_id": null,\n    "geo_polygon": null\n  }\n}` },
      { method: "POST", path: "/blocks", description: "Create block",
        exampleBody: `{\n  "name": "API Test Block",\n  "description": "Test block for API docs",\n  "instance_id": "435NDwI1vIXcCIOSnFuQ"\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "8a6b3560-8962-4700-ad4a-9f0b2e1e0367",\n    "name": "API Test Block",\n    "description": "Test block for API docs",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2026-03-16T10:56:52.637869",\n    "updated_at": "2026-03-16T10:56:52.637869",\n    "deleted_at": null,\n    "site_id": null,\n    "geo_polygon": null\n  }\n}` },
      { method: "PATCH", path: "/blocks/:blockId", description: "Update block",
        exampleBody: `{\n  "name": "API Test Block (Updated)",\n  "description": "Updated description"\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "8a6b3560-8962-4700-ad4a-9f0b2e1e0367",\n    "name": "API Test Block (Updated)",\n    "description": "Updated description",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2026-03-16T10:56:52.637869",\n    "updated_at": "2026-03-16T10:56:52.637869",\n    "deleted_at": null,\n    "site_id": null,\n    "geo_polygon": null\n  }\n}` },
      { method: "DELETE", path: "/blocks/:blockId", description: "Soft-delete block",
        exampleResponse: `{\n  "success": true\n}` },
    ],
  },
  {
    title: "Rooms",
    description: "Filter with ?block_id=, ?instance_id=, or ?site_id=.",
    endpoints: [
      { method: "GET", path: "/rooms", description: "List rooms (?block_id=, ?instance_id=)",
        exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "JtPQG9R4mdnmqDIurUdl",\n      "room_number": "9",\n      "name": "9",\n      "block_id": "344rZ2npxulvFFhrVjtY",\n      "capacity": 1,\n      "instance_id": "435NDwI1vIXcCIOSnFuQ",\n      "tenant_id": "KettleOrganisation",\n      "created_at": "2025-08-03T17:35:46.453",\n      "updated_at": "2025-08-03T17:35:46.453",\n      "deleted_at": null,\n      "site_id": null,\n      "geo_position": null,\n      "room_type": "room"\n    }\n  ],\n  "meta": {\n    "total": 392,\n    "limit": 1,\n    "offset": 0\n  }\n}` },
      { method: "GET", path: "/rooms/:roomId", description: "Get room by ID",
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "JtPQG9R4mdnmqDIurUdl",\n    "room_number": "9",\n    "name": "9",\n    "block_id": "344rZ2npxulvFFhrVjtY",\n    "capacity": 1,\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2025-08-03T17:35:46.453",\n    "updated_at": "2025-08-03T17:35:46.453",\n    "deleted_at": null,\n    "site_id": null,\n    "geo_position": null,\n    "room_type": "room"\n  }\n}` },
      { method: "POST", path: "/rooms", description: "Create room",
        exampleBody: `{\n  "name": "API Test Room",\n  "room_number": "999",\n  "block_id": "8a6b3560-8962-4700-ad4a-9f0b2e1e0367",\n  "capacity": 4,\n  "room_type": "room",\n  "instance_id": "435NDwI1vIXcCIOSnFuQ"\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "6d5360f5-bdb8-4b28-a763-69e5919c1858",\n    "room_number": "999",\n    "name": "API Test Room",\n    "block_id": "8a6b3560-8962-4700-ad4a-9f0b2e1e0367",\n    "capacity": 4,\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2026-03-16T10:57:06.79054",\n    "updated_at": "2026-03-16T10:57:06.79054",\n    "deleted_at": null,\n    "site_id": null,\n    "geo_position": null,\n    "room_type": "room"\n  }\n}` },
      { method: "PATCH", path: "/rooms/:roomId", description: "Update room",
        exampleBody: `{\n  "name": "API Test Room (Updated)",\n  "capacity": 6\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "6d5360f5-bdb8-4b28-a763-69e5919c1858",\n    "room_number": "999",\n    "name": "API Test Room (Updated)",\n    "block_id": "8a6b3560-8962-4700-ad4a-9f0b2e1e0367",\n    "capacity": 6,\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2026-03-16T10:57:06.79054",\n    "updated_at": "2026-03-16T10:57:06.79054",\n    "deleted_at": null,\n    "site_id": null,\n    "geo_position": null,\n    "room_type": "room"\n  }\n}` },
      { method: "DELETE", path: "/rooms/:roomId", description: "Soft-delete room",
        exampleResponse: `{\n  "success": true\n}` },
    ],
  },
  {
    title: "Groups (Legacy)",
    description: "Backward-compatible. Prefer instance-scoped routes.",
    endpoints: [
      { method: "GET", path: "/groups/supergroups", description: "List supergroups (?instance_id=)",
        exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "Realm of Chaos",\n      "name": "Unnamed Group",\n      "description": null,\n      "type": "supergroup",\n      "purpose": null,\n      "notifications": true,\n      "instance_id": "5jYJX2Esfj4pVd8RUn6Q",\n      "tenant_id": "KettleOrganisation",\n      "created_at": "2025-11-03T18:41:17.076",\n      "updated_at": "2025-11-03T18:51:14.863",\n      "deleted_at": null\n    }\n  ],\n  "meta": {\n    "total": 33,\n    "limit": 1,\n    "offset": 0\n  }\n}` },
      { method: "POST", path: "/groups/supergroups", description: "Create supergroup",
        exampleBody: `{\n  "name": "API Legacy Test House",\n  "instance_id": "435NDwI1vIXcCIOSnFuQ",\n  "type": "participant",\n  "notifications": true\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "bbdfa6c6-f35e-452a-a8bc-d627ad44c5ec",\n    "name": "API Legacy Test House",\n    "description": null,\n    "type": "participant",\n    "purpose": null,\n    "notifications": true,\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2026-03-16T10:58:09.516536",\n    "updated_at": "2026-03-16T10:58:09.516536",\n    "deleted_at": null\n  }\n}` },
      { method: "GET", path: "/groups/subgroups", description: "List subgroups (?instance_id=)",
        exampleResponse: `{\n  "success": true,\n  "data": [\n    {\n      "id": "5U6smhNoDXbd4QSMbcu4",\n      "name": "Unicorn",\n      "description": "Auto-created subgroup: Unicorn",\n      "type": "staff",\n      "purpose": "general",\n      "notifications": true,\n      "parent_supergroup_id": "88lhZMucgxNbpK9GkelY",\n      "instance_id": "435NDwI1vIXcCIOSnFuQ",\n      "tenant_id": "KettleOrganisation",\n      "created_at": "2025-08-03T17:35:46.453",\n      "updated_at": "2025-08-03T17:35:46.453",\n      "deleted_at": null,\n      "tracker_name": null,\n      "hardware_id": null,\n      "route_id": null,\n      "last_activity_at": null,\n      "is_vehicle": false\n    }\n  ],\n  "meta": {\n    "total": 104,\n    "limit": 1,\n    "offset": 0\n  }\n}` },
      { method: "POST", path: "/groups/subgroups", description: "Create subgroup",
        exampleBody: `{\n  "name": "API Legacy Test Subgroup",\n  "parent_supergroup_id": "bbdfa6c6-f35e-452a-a8bc-d627ad44c5ec",\n  "instance_id": "435NDwI1vIXcCIOSnFuQ",\n  "type": "participant",\n  "notifications": true\n}`,
        exampleResponse: `{\n  "success": true,\n  "data": {\n    "id": "4f9d757e-89e0-4cca-a9f0-e36a00f8e3a5",\n    "name": "API Legacy Test Subgroup",\n    "description": null,\n    "type": "participant",\n    "purpose": null,\n    "notifications": true,\n    "parent_supergroup_id": "bbdfa6c6-f35e-452a-a8bc-d627ad44c5ec",\n    "instance_id": "435NDwI1vIXcCIOSnFuQ",\n    "tenant_id": "KettleOrganisation",\n    "created_at": "2026-03-16T10:58:15.625956",\n    "updated_at": "2026-03-16T10:58:15.625956",\n    "deleted_at": null,\n    "tracker_name": null,\n    "hardware_id": null,\n    "route_id": null,\n    "last_activity_at": null,\n    "is_vehicle": false\n  }\n}` },
    ],
  },
];

// ── Reference endpoint detail dialog ──
interface EndpointDetailProps {
  endpoint: { method: string; path: string; description: string; exampleBody?: string; exampleResponse?: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTryIt: (method: string, path: string, body?: string) => void;
}

const EndpointDetailDialog = ({ endpoint, open, onOpenChange, onTryIt }: EndpointDetailProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  if (!endpoint) return null;

  const copy = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const curlCmd = `curl '${API_BASE_URL}${endpoint.path}' \\\n  -X ${endpoint.method} \\\n  -H "X-API-Key: chk_your_key_here"${endpoint.exampleBody ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${endpoint.exampleBody}'` : ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className={`font-mono text-xs ${methodColor[endpoint.method] ?? ""}`}>{endpoint.method}</Badge>
            <code className="text-sm font-mono">{endpoint.path}</code>
          </DialogTitle>
          <DialogDescription>{endpoint.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* cURL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">cURL</Label>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copy(curlCmd, "curl")}>
                {copiedField === "curl" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto text-muted-foreground">{curlCmd}</pre>
          </div>

          {/* Request body */}
          {endpoint.exampleBody && (
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Request Body</Label>
              <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto text-foreground/80 mt-1">
                {JSON.stringify(JSON.parse(endpoint.exampleBody), null, 2)}
              </pre>
            </div>
          )}

          {/* Response */}
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Example Response</Label>
            <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto text-foreground/80 mt-1">
              {JSON.stringify(JSON.parse(endpoint.exampleResponse || "{}"), null, 2)}
            </pre>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => { onTryIt(endpoint.method, endpoint.path, endpoint.exampleBody); onOpenChange(false); }}>
            <Play className="w-3.5 h-3.5 mr-1.5" />Try in Playground
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main component ──
const AdminDeveloperTab = () => {
  const [activeTab, setActiveTab] = useState("keys");

  // Keys state
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newKeyAllowedIps, setNewKeyAllowedIps] = useState("");
  const [ipDialogKey, setIpDialogKey] = useState<ApiKey | null>(null);
  const [editingIps, setEditingIps] = useState("");

  // Logs state
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<{ method?: string; status?: string }>({});
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);

  // Playground state
  const [pgMethod, setPgMethod] = useState("GET");
  const [pgPath, setPgPath] = useState("/instances");
  const [pgApiKey, setPgApiKey] = useState("");
  const [pgBody, setPgBody] = useState("");
  const [pgResponse, setPgResponse] = useState<string | null>(null);
  const [pgStatus, setPgStatus] = useState<number | null>(null);
  const [pgTime, setPgTime] = useState<number | null>(null);
  const [pgLoading, setPgLoading] = useState(false);
  const [pgParams, setPgParams] = useState<Record<string, string>>({});

  // Reference state
  const [detailEndpoint, setDetailEndpoint] = useState<typeof endpointGroups[0]["endpoints"][0] | null>(null);
  const [refSearch, setRefSearch] = useState("");

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ── PDF Download ──
  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();
    const margin = 16;
    const contentW = pw - margin * 2;
    let y = 20;

    const checkPage = (need: number) => {
      if (y + need > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
    };

    // Brand header bar
    doc.setFillColor(10, 36, 34); // JLGB navy-ish
    doc.rect(0, 0, pw, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CheckPoint API Reference", margin, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Base URL: ${API_BASE_URL}`, margin, 22);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, margin, 28);
    y = 42;

    // Auth note
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.text("All endpoints require X-API-Key header unless otherwise noted.", margin, y);
    y += 8;

    endpointGroups.forEach((group) => {
      checkPage(24);

      // Group header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 4, contentW, 10, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(group.title, margin + 2, y + 2);
      y += 10;

      if (group.description) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(group.description, margin + 2, y);
        y += 5;
      }

      group.endpoints.forEach((ep) => {
        checkPage(30);

        // Method + path
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        const methodColors: Record<string, [number, number, number]> = {
          GET: [16, 185, 129], POST: [59, 130, 246], PATCH: [245, 158, 11],
          PUT: [245, 158, 11], DELETE: [239, 68, 68],
        };
        const mc = methodColors[ep.method] || [100, 100, 100];
        doc.setTextColor(mc[0], mc[1], mc[2]);
        doc.text(ep.method, margin + 2, y);
        const mw = doc.getTextWidth(ep.method) + 3;
        doc.setTextColor(30, 30, 30);
        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        doc.text(ep.path, margin + 2 + mw, y);
        y += 4;

        // Description
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 100);
        doc.text(ep.description, margin + 2, y);
        y += 4;

        // Example body
        if (ep.exampleBody) {
          checkPage(20);
          doc.setFontSize(6.5);
          doc.setTextColor(60, 60, 60);
          doc.setFont("helvetica", "bold");
          doc.text("Request Body:", margin + 2, y);
          y += 3;
          doc.setFont("courier", "normal");
          doc.setFontSize(6);
          try {
            const formatted = JSON.stringify(JSON.parse(ep.exampleBody), null, 2);
            const lines = formatted.split("\n").slice(0, 12);
            lines.forEach((line) => {
              checkPage(4);
              doc.text(line, margin + 4, y);
              y += 3;
            });
            if (formatted.split("\n").length > 12) {
              doc.text("  ...", margin + 4, y);
              y += 3;
            }
          } catch { /* skip */ }
        }

        // Example response
        if (ep.exampleResponse) {
          checkPage(20);
          doc.setFontSize(6.5);
          doc.setTextColor(60, 60, 60);
          doc.setFont("helvetica", "bold");
          doc.text("Example Response:", margin + 2, y);
          y += 3;
          doc.setFont("courier", "normal");
          doc.setFontSize(6);
          try {
            const formatted = JSON.stringify(JSON.parse(ep.exampleResponse), null, 2);
            const lines = formatted.split("\n").slice(0, 12);
            lines.forEach((line) => {
              checkPage(4);
              doc.text(line, margin + 4, y);
              y += 3;
            });
            if (formatted.split("\n").length > 12) {
              doc.text("  ...", margin + 4, y);
              y += 3;
            }
          } catch { /* skip */ }
        }

        // Separator line
        y += 2;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y, pw - margin, y);
        y += 4;
      });

      y += 4;
    });

    // Footer on every page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.setFont("helvetica", "normal");
      const ph = doc.internal.pageSize.getHeight();
      doc.text(`CheckPoint API Reference — Page ${i} of ${totalPages}`, margin, ph - 8);
      doc.text("checkpoint.jlgb.org", pw - margin - doc.getTextWidth("checkpoint.jlgb.org"), ph - 8);
    }

    doc.save("CheckPoint-API-Reference.pdf");
    toast({ title: "PDF downloaded" });
  };

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ value, field }: { value: string; field: string }) => (
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(value, field)}>
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  // --- Keys ---
  const fetchKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`${API_INTERNAL_URL}/api/v1/api-keys/list`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) setKeys(data.data || []);
    } catch { /* silent */ } finally { setKeysLoading(false); }
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`${API_INTERNAL_URL}/api/v1/api-keys/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName || "Untitled",
          scopes: newKeyScopes,
          expires_at: newKeyExpiry || null,
          allowed_ips: newKeyAllowedIps.trim() ? newKeyAllowedIps.split(",").map((ip) => ip.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedKey(data.data.key);
        setCreateOpen(false);
        setNewKeyName(""); setNewKeyScopes(["read"]); setNewKeyExpiry(""); setNewKeyAllowedIps("");
        fetchKeys();
        toast({ title: "API key created" });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch { toast({ title: "Error creating key", variant: "destructive" }); }
    finally { setCreating(false); }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`${API_INTERNAL_URL}/api/v1/api-keys/revoke`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: revokeTarget.id }),
      });
      const data = await res.json();
      if (!data.success) {
        toast({ title: "Error revoking key", description: data.error, variant: "destructive" });
        return;
      }
      setRevokeTarget(null);
      fetchKeys();
      toast({ title: "API key revoked" });
    } catch (e) {
      toast({ title: "Error revoking key", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  const handleUpdateIps = async () => {
    if (!ipDialogKey) return;
    try {
      const session = await getSession();
      if (!session) return;
      const ips = editingIps.trim() ? editingIps.split(",").map((ip) => ip.trim()).filter(Boolean) : [];
      const res = await fetch(`${API_INTERNAL_URL}/api/v1/api-keys/update`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: ipDialogKey.id, allowed_ips: ips }),
      });
      const data = await res.json();
      if (!data.success) {
        toast({ title: "Error updating IPs", description: data.error, variant: "destructive" });
        return;
      }
      setIpDialogKey(null);
      fetchKeys();
      toast({ title: "IP restrictions updated" });
    } catch (e) {
      toast({ title: "Error updating IPs", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  // --- Logs ---
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const session = await getSession();
      if (!session) return;
      const params = new URLSearchParams({ limit: "100" });
      if (logFilter.method) params.set("method", logFilter.method);
      if (logFilter.status) params.set("status", logFilter.status);
      const res = await fetch(`${API_INTERNAL_URL}/api/v1/logs?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch { /* silent */ } finally { setLogsLoading(false); }
  }, [logFilter]);

  // --- Playground ---
  const pgPathParams = (pgPath.match(/:([a-zA-Z_]+)/g) || []).map((p) => p.slice(1));
  const resolvedPath = pgPath.replace(/:([a-zA-Z_]+)/g, (_, name) => pgParams[name] || `:${name}`);
  const hasUnresolvedParams = pgPathParams.some((p) => !pgParams[p]);

  const updatePgPath = (newPath: string) => {
    setPgPath(newPath);
    const newParams = (newPath.match(/:([a-zA-Z_]+)/g) || []).map((p) => p.slice(1));
    setPgParams((prev) => {
      const next: Record<string, string> = {};
      newParams.forEach((p) => { if (prev[p]) next[p] = prev[p]; });
      return next;
    });
  };

  const sendRequest = async () => {
    if (hasUnresolvedParams) {
      toast({ title: "Missing parameters", description: "Please fill in all path parameters before sending.", variant: "destructive" });
      return;
    }
    setPgLoading(true); setPgResponse(null); setPgStatus(null); setPgTime(null);
    try {
      const start = Date.now();
      const headers: Record<string, string> = { "X-API-Key": pgApiKey };
      if (pgBody && ["POST", "PATCH", "PUT"].includes(pgMethod)) headers["Content-Type"] = "application/json";
      const internalPath = resolvedPath === "/health"
        ? "/health"
        : resolvedPath.startsWith("/api/")
          ? resolvedPath
          : `/api/v1${resolvedPath}`;
      const res = await fetch(`${API_INTERNAL_URL}${internalPath}`, {
        method: pgMethod, headers,
        body: ["POST", "PATCH", "PUT"].includes(pgMethod) && pgBody ? pgBody : undefined,
      });
      const elapsed = Date.now() - start;
      const text = await res.text();
      setPgStatus(res.status); setPgTime(elapsed);
      try { setPgResponse(JSON.stringify(JSON.parse(text), null, 2)); } catch { setPgResponse(text); }
    } catch (e) {
      setPgResponse(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
      setPgStatus(0);
    } finally { setPgLoading(false); }
  };

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) => prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]);
  };

  const getKeyStatus = (key: ApiKey) => {
    if (key.revoked_at) return { label: "Revoked", variant: "destructive" as const };
    if (key.expires_at && new Date(key.expires_at) < new Date()) return { label: "Expired", variant: "secondary" as const };
    return { label: "Active", variant: "default" as const };
  };

  const tryEndpoint = (method: string, path: string, body?: string) => {
    setPgMethod(method);
    updatePgPath(path);
    if (body) setPgBody(body); else setPgBody("");
    setActiveTab("playground");
  };

  const playgroundEndpoints = endpointGroups.flatMap((g) =>
    g.endpoints.map((ep) => ({ method: ep.method, path: ep.path, label: `${ep.method} ${ep.path}` }))
  );

  // Filtered reference endpoints
  const filteredGroups = refSearch
    ? endpointGroups.map((g) => ({
        ...g,
        endpoints: g.endpoints.filter((ep) =>
          ep.path.toLowerCase().includes(refSearch.toLowerCase()) ||
          ep.description.toLowerCase().includes(refSearch.toLowerCase()) ||
          ep.method.toLowerCase().includes(refSearch.toLowerCase())
        ),
      })).filter((g) => g.endpoints.length > 0)
    : endpointGroups;

  return (
    <div className="space-y-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-card border-b border-border px-6">
          <TabsList className="h-auto p-0 bg-transparent rounded-none border-none gap-0">
            {[
              { value: "keys", label: "API Keys", icon: Key },
              { value: "playground", label: "Playground", icon: Play },
              { value: "logs", label: "Logs", icon: FileText },
              { value: "reference", label: "Reference", icon: Code2 },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="relative rounded-none border-none bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent gap-1.5 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-primary transition-colors hover:text-foreground"
                onClick={() => { if (t.value === "logs" && logs.length === 0) fetchLogs(); }}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ===== KEYS TAB ===== */}
        <TabsContent value="keys" className="space-y-4 p-6">
          {/* Connection info bar */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Database className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground mr-2">Base URL</span>
              <code className="text-xs font-mono text-foreground">{API_BASE_URL}</code>
            </div>
            <CopyButton value={API_BASE_URL} field="base_url" />
          </div>

          {/* Keys table */}
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
                <p className="text-xs text-muted-foreground">Create and manage API keys for programmatic access</p>
              </div>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8"><Plus className="w-3.5 h-3.5 mr-1.5" />Create Key</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>The key will only be shown once after creation.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input placeholder="e.g. Production, CI/CD" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Scopes</Label>
                      <div className="flex gap-4">
                        {["read", "write", "admin"].map((scope) => (
                          <label key={scope} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={newKeyScopes.includes(scope)} onCheckedChange={() => toggleScope(scope)} />
                            <span className="capitalize">{scope}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Expiry (optional)</Label>
                      <Input type="datetime-local" value={newKeyExpiry} onChange={(e) => setNewKeyExpiry(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Allowed IPs (optional)</Label>
                      <Input placeholder="e.g. 203.0.113.1, 10.0.0.0" value={newKeyAllowedIps} onChange={(e) => setNewKeyAllowedIps(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground">Comma-separated. Leave empty to allow all IPs.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating…" : "Create Key"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {keysLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading keys…</p>
            ) : keys.length === 0 ? (
              <div className="py-12 text-center">
                <Key className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No API keys yet</p>
                <p className="text-xs text-muted-foreground/60">Create one to get started with the API</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>IP Restrictions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => {
                    const status = getKeyStatus(key);
                    const ips = key.allowed_ips || [];
                    return (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium text-sm">{key.name}</TableCell>
                        <TableCell><code className="text-xs font-mono text-muted-foreground">{key.key_prefix}…</code></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {key.scopes.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ips.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-primary shrink-0" />
                              <span className="text-xs text-muted-foreground">{ips.length} IP{ips.length > 1 ? "s" : ""}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">All allowed</span>
                          )}
                        </TableCell>
                        <TableCell><Badge variant={status.variant} className="text-[10px]">{status.label}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!key.revoked_at && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setIpDialogKey(key); setEditingIps((key.allowed_ips || []).join(", ")); }}>
                                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRevokeTarget(key)}>
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ===== PLAYGROUND TAB ===== */}
        <TabsContent value="playground" className="p-6">
          <div className="rounded-lg border border-border">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">API Playground</h3>
              <p className="text-xs text-muted-foreground">Test API endpoints with your API key</p>
            </div>
            <div className="p-4 space-y-4">
              {/* API Key input */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">API Key</Label>
                <Input type="password" placeholder="chk_..." value={pgApiKey} onChange={(e) => setPgApiKey(e.target.value)} className="font-mono text-xs" />
              </div>

              {/* Method + Path */}
              <div className="flex gap-2">
                <Select value={pgMethod} onValueChange={setPgMethod}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["GET", "POST", "PATCH", "DELETE"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={pgPath} onChange={(e) => updatePgPath(e.target.value)} placeholder="/instances" className="font-mono text-xs flex-1" />
                <Button onClick={sendRequest} disabled={pgLoading || !pgApiKey} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" />{pgLoading ? "Sending…" : "Send"}
                </Button>
              </div>

              {/* Path parameters */}
              {pgPathParams.length > 0 && (
                <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                  <Label className="text-xs text-muted-foreground font-medium">Path Parameters</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pgPathParams.map((param) => (
                      <div key={param} className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-mono">:{param}</Label>
                        <Input
                          value={pgParams[param] || ""}
                          onChange={(e) => setPgParams((prev) => ({ ...prev, [param]: e.target.value }))}
                          placeholder={`Enter ${param.replace(/_/g, " ")}`}
                          className="font-mono text-xs h-8"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-1">
                    Resolved: <span className="text-foreground">{resolvedPath}</span>
                  </div>
                </div>
              )}

              {/* Quick endpoint selector */}
              <div className="flex flex-wrap gap-1">
                {playgroundEndpoints.slice(0, 10).map((ep, i) => (
                  <Button key={i} variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => { setPgMethod(ep.method); updatePgPath(ep.path); }}>
                    <Badge variant="outline" className={`text-[9px] font-mono mr-1 px-1 ${methodColor[ep.method] ?? ""}`}>{ep.method}</Badge>
                    {ep.path.replace("/api/v1/", "")}
                  </Button>
                ))}
              </div>

              {/* Request body */}
              {["POST", "PATCH", "PUT"].includes(pgMethod) && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Request Body (JSON)</Label>
                  <Textarea value={pgBody} onChange={(e) => setPgBody(e.target.value)} placeholder='{"name": "Test"}' className="font-mono text-xs min-h-[80px]" />
                </div>
              )}

              {/* Response */}
              {pgResponse !== null && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground">Response</Label>
                    {pgStatus !== null && (
                      <Badge variant="outline" className={`text-[10px] ${pgStatus >= 200 && pgStatus < 300 ? "border-emerald-500/30 text-emerald-600" : "border-destructive/30 text-destructive"}`}>
                        {pgStatus}
                      </Badge>
                    )}
                    {pgTime !== null && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{pgTime}ms</span>
                    )}
                  </div>
                  <ScrollArea className="h-[300px] rounded-md border">
                    <pre className="text-xs font-mono p-3 text-foreground whitespace-pre-wrap">{pgResponse}</pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ===== LOGS TAB ===== */}
        <TabsContent value="logs" className="p-6">
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Request Logs</h3>
                <p className="text-xs text-muted-foreground">View all API requests made with your keys</p>
              </div>
              <Button variant="outline" size="sm" className="h-8" onClick={fetchLogs} disabled={logsLoading}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${logsLoading ? "animate-spin" : ""}`} />Refresh
              </Button>
            </div>
            <div className="p-4 space-y-3">
              {/* Filters */}
              <div className="flex gap-2">
                <Select value={logFilter.method || "all"} onValueChange={(v) => setLogFilter((f) => ({ ...f, method: v === "all" ? undefined : v }))}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {["GET", "POST", "PATCH", "DELETE"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={logFilter.status || "all"} onValueChange={(v) => setLogFilter((f) => ({ ...f, status: v === "all" ? undefined : v }))}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchLogs}>Apply</Button>
              </div>

              {logsLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading logs…</p>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No API request logs yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Method</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead className="w-16">Status</TableHead>
                        <TableHead className="w-16">Time</TableHead>
                        <TableHead className="w-20">Key</TableHead>
                        <TableHead className="w-36">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedLog(log)}>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-mono ${methodColor[log.method] ?? ""}`}>{log.method}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs truncate max-w-[200px]">{log.path}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-mono font-semibold ${statusColor(log.status_code)}`}>{log.status_code}</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{log.response_time_ms}ms</TableCell>
                          <TableCell><code className="text-[10px] text-muted-foreground">{log.key_prefix || "—"}</code></TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* Log detail dialog */}
          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono text-sm">
                  <Badge variant="outline" className={`${methodColor[selectedLog?.method || ""] ?? ""}`}>{selectedLog?.method}</Badge>
                  {selectedLog?.path}
                  <span className={`ml-auto font-semibold ${statusColor(selectedLog?.status_code || 0)}`}>{selectedLog?.status_code}</span>
                </DialogTitle>
                <DialogDescription>
                  {selectedLog && new Date(selectedLog.created_at).toLocaleString()} · {selectedLog?.response_time_ms}ms
                  {selectedLog?.key_prefix && ` · Key: ${selectedLog.key_prefix}…`}
                  {selectedLog?.ip_address && ` · IP: ${selectedLog.ip_address}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {selectedLog?.error_message && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                    <p className="text-xs font-medium text-destructive">{selectedLog.error_message}</p>
                  </div>
                )}
                {selectedLog?.request_body && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Request Body</Label>
                    <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-auto max-h-[200px]">{JSON.stringify(selectedLog.request_body, null, 2)}</pre>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Response Body</Label>
                  <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-auto max-h-[300px]">{selectedLog?.response_body ? JSON.stringify(selectedLog.response_body, null, 2) : "—"}</pre>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== REFERENCE TAB ===== */}
        <TabsContent value="reference" className="p-6 space-y-4">
          {/* Auth info bar */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Key className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 text-xs text-muted-foreground">
              All endpoints require <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">X-API-Key</code> header · Base URL: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{API_BASE_URL}</code>
            </div>
            <CopyButton value={API_BASE_URL} field="ref_base_url" />
          </div>

          {/* Search + Download */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search endpoints…"
                value={refSearch}
                onChange={(e) => setRefSearch(e.target.value)}
                className="text-xs h-9 pl-8"
              />
              <Code2 className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 shrink-0" onClick={downloadPdf}>
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </Button>
          </div>

          {/* Endpoint tables by group */}
          {filteredGroups.map((group) => (
            <div key={group.title} className="rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                <h4 className="text-sm font-semibold text-foreground">{group.title}</h4>
                {group.description && <p className="text-[11px] text-muted-foreground mt-0.5">{group.description}</p>}
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-20">Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.endpoints.map((ep, i) => (
                    <TableRow
                      key={i}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setDetailEndpoint(ep)}
                    >
                      <TableCell className="py-2">
                        <Badge variant="outline" className={`text-[10px] font-mono w-[52px] justify-center ${methodColor[ep.method] ?? ""}`}>
                          {ep.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <code className="text-xs font-mono text-foreground">{ep.path}</code>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground hidden md:table-cell">
                        {ep.description}
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={(e) => { e.stopPropagation(); tryEndpoint(ep.method, ep.path, ep.exampleBody); }}
                        >
                          <Play className="w-3 h-3 mr-1" />Try
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Endpoint detail dialog */}
      <EndpointDetailDialog
        endpoint={detailEndpoint}
        open={!!detailEndpoint}
        onOpenChange={(open) => { if (!open) setDetailEndpoint(null); }}
        onTryIt={tryEndpoint}
      />

      {/* Created key display */}
      <Dialog open={!!createdKey} onOpenChange={() => setCreatedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Save Your API Key</DialogTitle>
            <DialogDescription>This key will only be shown once. Copy it now and store it securely.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={createdKey || ""} readOnly className="font-mono text-xs" />
            <CopyButton value={createdKey || ""} field="created_key" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke <strong>{revokeTarget?.name}</strong> ({revokeTarget?.key_prefix}…). Any integrations using this key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* IP Restrictions Dialog */}
      <Dialog open={!!ipDialogKey} onOpenChange={() => setIpDialogKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              IP Restrictions — {ipDialogKey?.name}
            </DialogTitle>
            <DialogDescription>
              Restrict this API key to specific IP addresses. Leave empty to allow all IPs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Allowed IP Addresses</Label>
              <Textarea
                placeholder="Enter comma-separated IPs, e.g. 203.0.113.1, 10.0.0.5"
                value={editingIps}
                onChange={(e) => setEditingIps(e.target.value)}
                rows={3}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Comma-separated IPv4/IPv6 addresses. Requests from unlisted IPs will be rejected with 403.
              </p>
            </div>
            {editingIps.trim() && (
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Preview</Label>
                <div className="flex flex-wrap gap-1">
                  {editingIps.split(",").map((ip) => ip.trim()).filter(Boolean).map((ip, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] font-mono gap-1">
                      {ip}
                      <button onClick={() => setEditingIps((prev) => prev.split(",").map((s) => s.trim()).filter((s) => s !== ip).join(", "))} className="hover:text-destructive">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIpDialogKey(null)}>Cancel</Button>
            <Button onClick={handleUpdateIps}>Save Restrictions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDeveloperTab;
