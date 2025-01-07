// src/routes/miraen/middle-math-pro/utils/recommendationService.js
import { mathProSupabase } from '$lib/mathProSupabaseClient';

export async function fetchRecommendedProblems(wrongEpisodes, score) {
  try {
    if (score <= 40) {
      return await fetchLowScoreRecommendations(wrongEpisodes);
    } else if (score <= 70) {
      return await fetchMidScoreRecommendations(wrongEpisodes);
    } else {
      return await fetchHighScoreRecommendations(wrongEpisodes);
    }
  } catch (err) {
    console.error('맞춤 문항 로딩 에러:', err);
    return { problems: [], error: err };
  }
}

async function fetchLowScoreRecommendations(wrongEpisodes) {
  const { data, error } = await mathProSupabase
    .from('problems')
    .select('*')
    .in('episode', wrongEpisodes)
    .or('activity_category.eq.이해,activity_category.eq.계산');

  if (error) throw error;

  const recommendations = [];
  wrongEpisodes.forEach(episode => {
    const episodeProblems = data.filter(p => p.episode === episode);
    const understanding = episodeProblems.find(p => p.activity_category === '이해');
    const calculation = episodeProblems.find(p => p.activity_category === '계산');
    
    if (understanding) recommendations.push(understanding);
    if (calculation) recommendations.push(calculation);
  });

  return { problems: recommendations };
}

async function fetchMidScoreRecommendations(wrongEpisodes) {
  try {
    const { data, error } = await mathProSupabase
      .from('problems')
      .select('*')
      .in('episode', wrongEpisodes)
      .eq('activity_category', '이해');

    if (error) throw error;

    // 각 에피소드별로 2개씩 문제 선택
    const recommendations = [];
    wrongEpisodes.forEach(episode => {
      const episodeProblems = data
        .filter(p => p.episode === episode)
        // 랜덤하게 섞기
        .sort(() => Math.random() - 0.5)
        // 각 에피소드당 2개씩 선택
        .slice(0, 2);
      
      recommendations.push(...episodeProblems);
    });

    return { problems: recommendations };
  } catch (err) {
    console.error('중급 추천 문항 로딩 에러:', err);
    throw err;
  }
}

async function fetchHighScoreRecommendations(wrongEpisodes) {
  const [understandingResponse, advancedResponse] = await Promise.all([
    mathProSupabase
      .from('problems')
      .select('*')
      .in('episode', wrongEpisodes)
      .eq('activity_category', '이해')
      .limit(1),
    
    mathProSupabase
      .from('problems')
      .select('*')
      .or('activity_category.eq.추론,activity_category.eq.문제 해결')
      .limit(5)
  ]);

  if (understandingResponse.error) throw understandingResponse.error;
  if (advancedResponse.error) throw advancedResponse.error;

  return {
    problems: [
      ...understandingResponse.data,
      ...advancedResponse.data
    ]
  };
} 