CREATE TABLE public.formal_warnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.tenants(id),
  instance_id TEXT NOT NULL REFERENCES public.instances(id),
  participant_id TEXT NOT NULL REFERENCES public.participants(id),
  case_id UUID REFERENCES public.behavior_cases(id),
  warning_level INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  details TEXT,
  issued_by TEXT,
  issued_by_name TEXT,
  parent_notified BOOLEAN NOT NULL DEFAULT false,
  parent_notification_date TIMESTAMPTZ,
  acknowledged_by_participant BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.formal_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read formal_warnings"
  ON public.formal_warnings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert formal_warnings"
  ON public.formal_warnings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update formal_warnings"
  ON public.formal_warnings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.formal_warnings (tenant_id, instance_id, participant_id, warning_level, reason, details, issued_by_name, parent_notified, parent_notification_date, acknowledged_by_participant, acknowledged_at)
VALUES
  ('KettleOrganisation', '435NDwI1vIXcCIOSnFuQ', '25652', 1, 'Disruptive behaviour during evening activities', 'Participant was repeatedly disruptive during the campfire session despite multiple verbal warnings from group leaders.', 'David Cohen', true, now() - interval '2 days', true, now() - interval '1 day'),
  ('KettleOrganisation', '435NDwI1vIXcCIOSnFuQ', '22617', 2, 'Repeated curfew violations', 'Second formal warning issued after participant was found out of room past curfew for the third time. Previous verbal and first formal warning were given.', 'Sarah Levy', true, now() - interval '1 day', false, null),
  ('KettleOrganisation', '435NDwI1vIXcCIOSnFuQ', '24919', 1, 'Inappropriate language towards staff', 'Participant used inappropriate language towards a group leader during morning roll call. Participant later apologised.', 'Michael Green', false, null, true, now() - interval '3 hours'),
  ('KettleOrganisation', '435NDwI1vIXcCIOSnFuQ', '24600', 3, 'Physical altercation with another participant', 'Third and final formal warning. Participant was involved in a physical altercation in the dining hall. Parents contacted immediately.', 'David Cohen', true, now() - interval '6 hours', true, now() - interval '4 hours'),
  ('KettleOrganisation', '435NDwI1vIXcCIOSnFuQ', '22617', 1, 'Failure to follow safety instructions', 'Participant ignored safety briefing instructions during hiking activity, leaving the designated trail despite clear warnings.', 'Rachel Silver', true, now() - interval '5 days', true, now() - interval '4 days');