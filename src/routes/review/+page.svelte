<script>
    import { page } from '$app/stores';
    import { derived } from 'svelte/store';
    import { Badge } from "$lib/shad/components/ui/badge/index.ts"
    import { preloadCode, preloadData } from '$app/navigation';
    import { onMount } from 'svelte';

    let projects = $state([]);
    let claimStates = $state({});
    let currentSlackId = $state("");
    let claimClock = $state(Date.now());
    let claimStatesLoaded = $state(false);
    let reviewStats = $state(null);
    let reviewStatsLoaded = $state(false);

    const formatRemainingTime = (remainingMs) => {
        const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    };

    const loadClaimStates = async (fetchedProjects) => {
        const entries = await Promise.all(fetchedProjects.map(async (project) => {
            try {
                const response = await fetch(`/api/review/getClaimer/${project.id}`);
                if (!response.ok) {
                    return [project.id, null];
                }
                return [project.id, await response.json()];
            } catch {
                return [project.id, null];
            }
        }));
        claimStates = Object.fromEntries(entries);
        claimStatesLoaded = true;
    };

    const getClaimState = (projectId) => claimStates[projectId] ?? null;
    const isClaimedBySomeoneElse = (project) => {
        const claimState = getClaimState(project.id);
        return Boolean(claimState?.claimedBy) && claimState.claimedBy !== currentSlackId;
    };
    const isClaimedByMe = (project) => {
        const claimState = getClaimState(project.id);
        return Boolean(claimState?.claimedBy) && claimState.claimedBy === currentSlackId;
    };
    const claimSummary = (project) => {
        const claimState = getClaimState(project.id);
        if (!claimState?.claimedBy) {
            return "unclaimed";
        }
        const expiresAt = claimState.expiresAt ? Date.parse(claimState.expiresAt) : 0;
        const remainingMs = expiresAt ? Math.max(0, expiresAt - claimClock) : claimState.remainingMs ?? 0;
        const ownerLabel = claimState.claimedBy === currentSlackId ? "claimed by you" : `claimed by ${claimState.claimedBy}`;
        return `${ownerLabel} · ${formatRemainingTime(remainingMs)} left`;
    };

    // preload dashboard
    onMount(() => {
        preloadData('/dashboard');
        preloadCode('/dashboard');
        const claimClockInterval = setInterval(() => {
            claimClock = Date.now();
        }, 1000);
        fetch('/api/me')
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                currentSlackId = data?.slackId || "";
            })
            .catch(() => {
                currentSlackId = "";
            });
        return () => clearInterval(claimClockInterval);
    });

    onMount(() => {
        fetch('/api/review/stats')
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                reviewStats = data;
                reviewStatsLoaded = true;
            })
            .catch(() => {
                reviewStats = null;
                reviewStatsLoaded = true;
            });
    });
//    const projects = [
//        {
//            id: "id1",
//            projectName: "Projehjkct 1",
//            description: "This is the first project.",
//            codeUrl: "https://github.com/hackclub/project1",
//            readmeUrl: "https://github.com/hackclub/project1/blob/main/README.md",
//            demoUrl: "https://project1.hackclub.com",
//            screenshot: "https://via.placeholder.com/150",
//            aiUsage: "Bla bla bla used bla bla",
//            hackatimeProject: "hackatime-project-1",
//            user: "U091DE0M4NB",
//            journeyNumber: 1,
//            type: "Web app",
//            status: "pending"
//        },
//        {
//            id: "id2",
//            projectName: "Projetrct 2",
//            description: "This is the second project.",
//            codeUrl: "https://github.com/hackclub/project2",
//            readmeUrl: "https://github.com/hackclub/project2/blob/main/README.md",
//            demoUrl: "https://project2.hackclub.com",
//            screenshot: "https://via.placeholder.com/150",
//            aiUsage: "Bla bla bla used bla bla",
//            hackatimeProject: "hackatime-project-2",
//            user: "U091DE0M4NB",
//            journeyNumber: 2,
//            type: "App",
//            status: "pending"
//        }
//    ];

    onMount(() => {
        let projectsRequest = fetch('/api/review/getPending')
            .then(response => response.json())
            .then(data => {
                return data.projects;
            })
            .catch(error => {
                console.error('Error fetching projects:', error);
                return [];
            });
        projectsRequest.then(fetchedProjects => {
            projects = fetchedProjects;
            claimStatesLoaded = false;
            void loadClaimStates(fetchedProjects);
        });
    });

    function getProjectTypeList(projects) {
        const types = new Set();
        projects.forEach(project => types.add(project.type));
        return Array.from(types);
    }
    function typeToAmount(type) {
        return projects.filter(project => project.type === type && project.status === "pending").length;
    }
    function pendingAmount() {
        return projects.filter(project => project.status === "pending").length;
    }
    function getProjectsPerType(type) {
        return projects.filter(project => project.type === type && project.status === "pending");
    }

    let activeType = derived(page, ($page) => $page.url.searchParams.get('type') || 'all');
</script>
<div class="flex flex-row flex-wrap items-center gap-4">
<a href="/review?type=all">
{#if $activeType === "all"}
    <Badge class="whitespace-nowrap">pending: {pendingAmount()}</Badge>
{:else}
    <Badge class="whitespace-nowrap" variant="secondary">pending: {pendingAmount()}</Badge>
{/if}
</a>
{#each getProjectTypeList(projects) as type}
<a href={`/review?type=${type}`}>
    {#if $activeType === type}
        <Badge class="whitespace-nowrap">{type}: {typeToAmount(type)}</Badge>
    {:else}
    <Badge variant="secondary" class="whitespace-nowrap">{type}: {typeToAmount(type)}</Badge>
    {/if}
</a>
{/each}
|
<a href="/review?type=stats">
{#if $activeType === "stats"}
    <Badge class="whitespace-nowrap">Statistics</Badge>
{:else}
    <Badge variant="secondary" class="whitespace-nowrap">Statistics</Badge>
{/if}
</a>
<a href="/dashboard">
    <Badge variant="secondary" class="whitespace-nowrap">Dashboard</Badge>
</a>
</div>
<div class="mt-4 flex flex-col gap-4">
{#if !claimStatesLoaded}
    <div class="p-4 rounded-md border border-border bg-secondary opacity-50">
        <div class="font-bold text-primary-foreground">Loading review cards...</div>
        <div class="text-sm text-foreground/80">Checking claim locks before showing cards.</div>
    </div>
{:else}
{#if $activeType === "all"}
    {#each projects.filter(project => project.status === "pending") as project}
    {#if isClaimedBySomeoneElse(project)}
        <div class="p-4 rounded-md border border-border bg-secondary opacity-50">
            <div class="font-bold text-primary-foreground">{project.projectName}</div>
            <div class="text-sm text-foreground/80">{project.description}</div>
            <div class="mt-2 text-xs text-foreground/70">type: {project.type} — journey {project.journeyNumber}</div>
            <div class="mt-2 text-xs font-semibold text-foreground/80">{claimSummary(project)}</div>
        </div>
    {:else}
        <a href={`/review/${project.id}`}>
            <div class="p-4 rounded-md border border-border bg-secondary">
                <div class="font-bold text-primary-foreground">{project.projectName}</div>
                <div class="text-sm text-foreground/80">{project.description}</div>
                <div class="mt-2 text-xs text-foreground/70">type: {project.type} — journey {project.journeyNumber}</div>
                {#if isClaimedByMe(project)}
                    <div class="mt-2 text-xs font-semibold text-foreground/80">{claimSummary(project)}</div>
                {/if}
            </div>
        </a>
    {/if}
    {/each}
{:else if $activeType === "stats"}
    <div class="p-4 rounded-md border border-border bg-secondary">
        <div class="font-bold text-primary-foreground">Statistics</div>
        {#if !reviewStatsLoaded}
            <div class="text-sm text-foreground/80">Loading public review statistics...</div>
        {:else if reviewStats}
            <div class="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-md border border-border bg-background/60 p-3">
                    <div class="text-xs uppercase tracking-wide text-foreground/60">Pending</div>
                    <div class="text-2xl font-bold text-primary-foreground">{reviewStats.publicInfo.pendingSubmissions}</div>
                </div>
                <div class="rounded-md border border-border bg-background/60 p-3">
                    <div class="text-xs uppercase tracking-wide text-foreground/60">Reviewed</div>
                    <div class="text-2xl font-bold text-primary-foreground">{reviewStats.publicInfo.reviewedSubmissions}</div>
                </div>
                <div class="rounded-md border border-border bg-background/60 p-3">
                    <div class="text-xs uppercase tracking-wide text-foreground/60">Projects</div>
                    <div class="text-2xl font-bold text-primary-foreground">{reviewStats.publicInfo.totalProjects}</div>
                </div>
            </div>
            <div class="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-md border border-border bg-background/60 p-3 text-sm text-foreground/80">Approved: <span class="font-semibold text-primary-foreground">{reviewStats.publicInfo.approvedProjects}</span></div>
                <div class="rounded-md border border-border bg-background/60 p-3 text-sm text-foreground/80">Rejected: <span class="font-semibold text-primary-foreground">{reviewStats.publicInfo.rejectedProjects}</span></div>
                <div class="rounded-md border border-border bg-background/60 p-3 text-sm text-foreground/80">Total submissions: <span class="font-semibold text-primary-foreground">{reviewStats.publicInfo.totalSubmissions}</span></div>
                <div class="rounded-md border border-border bg-background/60 p-3 text-sm text-foreground/80">Total reviewed for payout: <span class="font-semibold text-primary-foreground">{reviewStats.totals.paidFor}</span></div>
            </div>
            <hr class="my-4 border-border" />
            <div class="font-semibold text-primary-foreground">Reviewer breakdown</div>
            {#if reviewStats.reviewers.length === 0}
                <div class="text-sm text-foreground/80">No reviewer activity yet.</div>
            {:else}
                <div class="mt-3 overflow-x-auto">
                    <table class="min-w-full border-collapse text-sm">
                        <thead>
                            <tr class="text-left text-foreground/60">
                                <th class="border-b border-border px-2 py-2">Reviewer</th>
                                <th class="border-b border-border px-2 py-2">Reviewed</th>
                                <th class="border-b border-border px-2 py-2">Paid for</th>
                                <th class="border-b border-border px-2 py-2">Approved</th>
                                <th class="border-b border-border px-2 py-2">Rejected</th>
                                <th class="border-b border-border px-2 py-2">Pending</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each reviewStats.reviewers as reviewer}
                                <tr class="border-b border-border/60">
                                    <td class="px-2 py-2 font-medium text-primary-foreground">{reviewer.reviewer}</td>
                                    <td class="px-2 py-2">{reviewer.reviewed}</td>
                                    <td class="px-2 py-2">{reviewer.paidFor}</td>
                                    <td class="px-2 py-2">{reviewer.approved}</td>
                                    <td class="px-2 py-2">{reviewer.rejected}</td>
                                    <td class="px-2 py-2">{reviewer.pending}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
            <hr class="my-4 border-border" />
            <div class="text-sm text-foreground/80">Public summary: {reviewStats.totals.submissions} submissions, {reviewStats.totals.reviewed} reviewed, {reviewStats.totals.approved} approved, {reviewStats.totals.rejected} rejected.</div>
            <hr class="my-4 border-border" />
            <div class="font-semibold text-primary-foreground">Pending projects by type</div>
            {#each getProjectTypeList(projects) as type}
                <div class="text-sm text-foreground/80">{type}: {typeToAmount(type)}</div>
            {/each}
        {:else}
            <div class="text-sm text-foreground/80">Unable to load review statistics.</div>
        {/if}
    </div>
{:else}
    {#each getProjectsPerType($activeType) as project}
    {#if isClaimedBySomeoneElse(project)}
        <div class="p-4 rounded-md border border-border bg-secondary opacity-50">
            <div class="font-bold text-primary-foreground">{project.projectName}</div>
            <div class="text-sm text-foreground/80">{project.description}</div>
            <div class="mt-2 text-xs text-foreground/70">type: {project.type} — journey {project.journeyNumber}</div>
            <div class="mt-2 text-xs font-semibold text-foreground/80">{claimSummary(project)}</div>
        </div>
    {:else}
        <a href={`/review/${project.id}`}>
            <div class="p-4 rounded-md border border-border bg-secondary">
                <div class="font-bold text-primary-foreground">{project.projectName}</div>
                <div class="text-sm text-foreground/80">{project.description}</div>
                <div class="mt-2 text-xs text-foreground/70">type: {project.type} — journey {project.journeyNumber}</div>
                {#if isClaimedByMe(project)}
                    <div class="mt-2 text-xs font-semibold text-foreground/80">{claimSummary(project)}</div>
                {/if}
            </div>
        </a>
    {/if}
    {/each}
{/if}
{/if}
</div>