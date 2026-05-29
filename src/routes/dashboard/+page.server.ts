export async function load({ fetch }) {
  try {
    const response = await fetch('/api/projects/getProjects');
    const data = await response.json();
    
    const groupedProjects = data ?? {};
    const projects = Object.values(groupedProjects).flat();
    
    const getJourneyState = (journeyProjects) => {
      const project = journeyProjects[0];
      if (!project) return "locked";
      const status = String(project.status ?? "unshipped").toLowerCase();
      return status;
    };
    
    const journeysStatus = Array.from({ length: 7 }, (_, index) => {
      const journeyNumber = String(index + 1);
      const journeyProjects = groupedProjects[journeyNumber] ?? [];
      return getJourneyState(journeyProjects);
    });
    
    const responseExpedition = await fetch('/api/expedition/get');
    const dataExpedition = await responseExpedition.json();
    const activeExpedition = dataExpedition.activeExpedition;

    return {
      journeysStatus,
      activeExpedition,
      projects
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return {
      journeysStatus: Array(7).fill("locked"),
      projects: []
    };
  }
}
