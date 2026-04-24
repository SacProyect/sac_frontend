import { LoadingState, PageHeader } from "@/components/UI/v2";

import ContributionsFilter from "@/components/contributions/contributions-filter";

import ContributionsStatistics from "@/components/contributions/contributions-statistics";

import { GroupData } from "@/components/contributions/contribution-types";

import {
  normalizeContributionsGroups,
  normalizeFiscalGroupMembersResponse,
} from "@/components/contributions/normalize-contributions-response";

import {
  getContributions,
  getFiscalGroupMembers,
} from "@/components/utils/api/report-functions";

import { useAuth } from "@/hooks/use-auth";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import toast from "react-hot-toast";

import { useNavigate } from "react-router-dom";

/**

 * ContributionsPageV2 - Página de Contribuciones con diseño Shadcn UI v2.0

 */

export default function ContributionsPageV2() {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [groupData, setGroupData] = useState<GroupData[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const [startDate, setStartDate] = useState("2026-01-01");

  const [endDate, setEndDate] = useState("2026-12-31");

  const [selectedSupervisorId, setSelectedSupervisorId] = useState<
    string | null
  >(null);

  const [appliedDataKey, setAppliedDataKey] = useState<string | null>(null);

  const statisticsSectionRef = useRef<HTMLDivElement>(null);

  const userRole = user?.role;

  const coordinatedGroupId = user?.coordinatedGroup?.id ?? "";

  const detailGroupId =
    userRole === "COORDINATOR" ? coordinatedGroupId : selectedGroup;

  /** Evita un frame con `selectedGroup` ya elegido pero `groupData` aún sin árbol de contribuyentes (resumen viejo). */

  const effectiveSelectedGroup =
    userRole === "COORDINATOR" && coordinatedGroupId
      ? coordinatedGroupId
      : selectedGroup;

  const dataQueryKey = useMemo(
    () =>
      `${userRole ?? ""}|${detailGroupId}|${selectedSupervisorId ?? ""}|${startDate}|${endDate}`,

    [userRole, detailGroupId, selectedSupervisorId, startDate, endDate],
  );

  const statsPending = appliedDataKey !== dataQueryKey;

  const scrollToCoordinationStatistics = useCallback(() => {
    statisticsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  useEffect(() => {
    if (userRole === "COORDINATOR" && coordinatedGroupId) {
      setSelectedGroup(coordinatedGroupId);
    }
  }, [userRole, coordinatedGroupId]);

  useEffect(() => {
    if (!user) {
      navigate("/login");

      return;
    }

    const shouldFetch = user.role === "ADMIN" || user.role === "COORDINATOR";

    const hasValidDates = startDate && endDate;

    if (!shouldFetch || !hasValidDates) return;

    const requestKey = dataQueryKey;

    let cancelled = false;

    const fetchGroups = async () => {
      try {
        const query: Record<string, string> = {
          startDate,

          endDate,
        };

        if (selectedSupervisorId) {
          query.supervisorId = selectedSupervisorId;
        }

        const memberQuery: {
          startDate: string;
          endDate: string;
          supervisorId?: string;
        } = {
          startDate,

          endDate,
        };

        if (selectedSupervisorId) {
          memberQuery.supervisorId = selectedSupervisorId;
        }

        const mergeMembers = (
          groups: GroupData[],
          groupId: string,
          membersPayload: unknown,
        ) => {
          const members = normalizeFiscalGroupMembersResponse(membersPayload);

          return groups.map((g) => (g.id === groupId ? { ...g, members } : g));
        };

        if (user.role === "ADMIN") {
          const response = await getContributions(query);

          let groups = normalizeContributionsGroups(response);

          if (detailGroupId) {
            const detail = await getFiscalGroupMembers(
              detailGroupId,
              memberQuery,
            );

            groups = mergeMembers(groups, detailGroupId, detail);
          }

          if (!cancelled) {
            setGroupData(groups);
          }
        } else if (user.role === "COORDINATOR") {
          const groupId = user.coordinatedGroup?.id;

          if (!groupId) {
            toast.error(
              "No se encontró el grupo coordinado para este usuario.",
            );

            if (!cancelled) {
              setAppliedDataKey(requestKey);
            }

            return;
          }

          query.id = groupId;

          const response = await getContributions(query);

          let groups = normalizeContributionsGroups(response);

          const detail = await getFiscalGroupMembers(groupId, memberQuery);

          groups = mergeMembers(groups, groupId, detail);

          if (!cancelled) {
            setGroupData(groups);
          }
        } else {
          navigate("/401");
        }
      } catch (e) {
        console.error(e);

        toast.error("No se pudieron obtener las contribuciones.");
      } finally {
        if (!cancelled) {
          setAppliedDataKey(requestKey);
        }
      }
    };

    void fetchGroups();

    return () => {
      cancelled = true;
    };
  }, [dataQueryKey, user, navigate]);

  return (
    <div className="w-full space-y-8 duration-700 animate-in fade-in">
      <PageHeader
        title="Contribuciones"
        description="Seguimiento detallado de recaudación por fiscal y coordinación"
      />

      <div className="space-y-10">
        <ContributionsFilter
          groupData={groupData}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setSelectedGroup={setSelectedGroup}
          setSelectedSupervisorId={setSelectedSupervisorId}
          onViewFullCoordination={scrollToCoordinationStatistics}
        />

        <div
          ref={statisticsSectionRef}
          id="contributions-statistics-section"
          className="scroll-mt-6 pt-4"
        >
          {statsPending ? (
            <LoadingState message="Cargando métricas de contribución..." />
          ) : (
            <ContributionsStatistics
              groupData={groupData}
              selectedGroup={effectiveSelectedGroup}
              selectedSupervisorId={selectedSupervisorId}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
