// src/routes/miraen/middle-math-pro/services/formativeQuizService.js
import { mathProSupabase } from '$lib/mathProSupabaseClient';

export async function fetchFormativeProblems(classOrderTitle) {
  try {
    const { data, error } = await mathProSupabase
      .from('problems')
      .select('id, problem, correct_answer, explanation, class_order_title, topic, activity_category, episode')
      .eq('class_order_title', classOrderTitle)
      .eq('activity_category', '이해');

    if (error) throw error;

    // episode별로 문제 그룹화
    const episodeGroups = groupProblemsByEpisode(data);
    
    // 각 episode에서 2문제씩 선택하고 정렬
    const selectedProblems = selectAndSortProblems(episodeGroups);
    
    return {
      problems: selectedProblems,
      totalEpisodes: Object.keys(episodeGroups).length,
      error: null
    };
    
  } catch (err) {
    console.error('형성평가 문제 로딩 에러:', err);
    return {
      problems: [],
      totalEpisodes: 0,
      error: err
    };
  }
}

function groupProblemsByEpisode(problems) {
  const episodeGroups = {};
  problems.forEach(problem => {
    if (!episodeGroups[problem.episode]) {
      episodeGroups[problem.episode] = [];
    }
    episodeGroups[problem.episode].push(problem);
  });
  return episodeGroups;
}

function selectAndSortProblems(episodeGroups) {
  // 각 episode에서 2문제씩 선택
  const selectedProblems = [];
  Object.entries(episodeGroups).forEach(([episode, problems]) => {
    const shuffled = problems.sort(() => Math.random() - 0.5);
    selectedProblems.push(...shuffled.slice(0, 2));
  });
  
  // episode 순서대로 정렬
  const sortedProblems = selectedProblems.sort((a, b) => {
    return a.episode.localeCompare(b.episode, undefined, { numeric: true });
  });

  // 각 문제에 대한 사용자 응답 초기화
  return sortedProblems.map(p => ({
    ...p,
    userAnswer: null // true = 정답, false = 오답, null = 미선택
  }));
} 