const Homicide = require('../models/Homicide');
const ShootingIncidents = require('../models/ShootingIncidents');
const PedestrianKSI = require('../models/PedestrianKSI');
const BreakAndEnter = require('../models/BreakAndEnter');
const FatalAccident = require('../models/FatalAccident');

const calculateRiskScore = (incidents, maxIncidents) => {
    if (maxIncidents === 0) return 0;
    return Math.min((incidents / maxIncidents) * 100, 100);
};

const getRiskLevel = (score) => {
    if (score >= 80) return { level: 'Very High', color: '#d32f2f' };
    if (score >= 60) return { level: 'High', color: '#f44336' };
    if (score >= 40) return { level: 'Moderate', color: '#ff9800' };
    if (score >= 20) return { level: 'Low', color: '#4caf50' };
    return { level: 'Very Low', color: '#2e7d32' };
};

const calculateTrend = (incidents) => {
    if (!incidents || incidents.length < 2) return 0;
    
    const recentCount = incidents.slice(0, Math.floor(incidents.length / 2)).length;
    const olderCount = incidents.slice(Math.floor(incidents.length / 2)).length;
    
    if (olderCount === 0) return 100; 
    return ((recentCount - olderCount) / olderCount) * 100;
};

const predictFutureIncidents = (incidents, months = 3) => {
    if (!incidents || incidents.length < 2) return 0;
    
    const monthlyData = incidents.reduce((acc, incident) => {
        const date = new Date(incident.OCC_DATE || incident.DATE);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
    }, {});

    const monthlyValues = Object.values(monthlyData);
    const avgMonthlyIncidents = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
    const monthlyGrowthRates = [];
    
    for (let i = 1; i < monthlyValues.length; i++) {
        if (monthlyValues[i - 1] !== 0) {
            monthlyGrowthRates.push((monthlyValues[i] - monthlyValues[i - 1]) / monthlyValues[i - 1]);
        }
    }

    const avgGrowthRate = monthlyGrowthRates.length > 0 
        ? monthlyGrowthRates.reduce((a, b) => a + b, 0) / monthlyGrowthRates.length 
        : 0;

    return Math.round(avgMonthlyIncidents * Math.pow(1 + avgGrowthRate, months));
};

const analyzeSafetyByNeighbourhood = async (filteredData = null) => {
    try {
        const [homicides, shootings, pedestrianIncidents, breakAndEnters, fatalAccidents] = await Promise.all([
            filteredData?.homicides || Homicide.find(),
            filteredData?.shootings || ShootingIncidents.find(),
            filteredData?.pedestrianIncidents || PedestrianKSI.find(),
            filteredData?.breakAndEnters || BreakAndEnter.find(),
            filteredData?.fatalAccidents || FatalAccident.find()
        ]);

        const neighbourhoodStats = {};

        const processIncidents = (incidents, type) => {
            incidents.forEach(incident => {
                const hood = incident.neighbourhood || 'Unknown';
                if (!neighbourhoodStats[hood]) {
                    neighbourhoodStats[hood] = {
                        homicides: [],
                        shootings: [],
                        pedestrianIncidents: [],
                        breakAndEnters: [],
                        fatalAccidents: [],
                        total: 0
                    };
                }
                neighbourhoodStats[hood][type].push(incident);
                neighbourhoodStats[hood].total++;
            });
        };

        processIncidents(homicides, 'homicides');
        processIncidents(shootings, 'shootings');
        processIncidents(pedestrianIncidents, 'pedestrianIncidents');
        processIncidents(breakAndEnters, 'breakAndEnters');
        processIncidents(fatalAccidents, 'fatalAccidents');

        const maxStats = {
            homicides: Math.max(...Object.values(neighbourhoodStats).map(stats => stats.homicides.length)),
            shootings: Math.max(...Object.values(neighbourhoodStats).map(stats => stats.shootings.length)),
            pedestrianIncidents: Math.max(...Object.values(neighbourhoodStats).map(stats => stats.pedestrianIncidents.length)),
            breakAndEnters: Math.max(...Object.values(neighbourhoodStats).map(stats => stats.breakAndEnters.length)),
            fatalAccidents: Math.max(...Object.values(neighbourhoodStats).map(stats => stats.fatalAccidents.length))
        };

        const safetyAnalysis = Object.entries(neighbourhoodStats).map(([neighbourhood, stats]) => {

            const scores = {
                homicides: calculateRiskScore(stats.homicides.length, maxStats.homicides) * 0.3,
                shootings: calculateRiskScore(stats.shootings.length, maxStats.shootings) * 0.25,
                pedestrianIncidents: calculateRiskScore(stats.pedestrianIncidents.length, maxStats.pedestrianIncidents) * 0.15,
                breakAndEnters: calculateRiskScore(stats.breakAndEnters.length, maxStats.breakAndEnters) * 0.15,
                fatalAccidents: calculateRiskScore(stats.fatalAccidents.length, maxStats.fatalAccidents) * 0.15
            };

            const trends = {
                homicides: calculateTrend(stats.homicides),
                shootings: calculateTrend(stats.shootings),
                pedestrianIncidents: calculateTrend(stats.pedestrianIncidents),
                breakAndEnters: calculateTrend(stats.breakAndEnters),
                fatalAccidents: calculateTrend(stats.fatalAccidents)
            };

            const predictions = {
                homicides: predictFutureIncidents(stats.homicides),
                shootings: predictFutureIncidents(stats.shootings),
                pedestrianIncidents: predictFutureIncidents(stats.pedestrianIncidents),
                breakAndEnters: predictFutureIncidents(stats.breakAndEnters),
                fatalAccidents: predictFutureIncidents(stats.fatalAccidents)
            };

            const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
            const riskLevel = getRiskLevel(totalScore);

            const totalTrend = Object.values(trends).reduce((sum, trend) => sum + trend, 0) / Object.keys(trends).length;

            return {
                neighbourhood,
                riskScore: Math.round(totalScore),
                riskLevel: riskLevel.level,
                riskColor: riskLevel.color,
                incidents: {
                    homicides: stats.homicides.length,
                    shootings: stats.shootings.length,
                    pedestrianIncidents: stats.pedestrianIncidents.length,
                    breakAndEnters: stats.breakAndEnters.length,
                    fatalAccidents: stats.fatalAccidents.length,
                    total: stats.total
                },
                trends,
                predictions,
                overallTrend: Math.round(totalTrend),
                details: {
                    homicideScore: Math.round(scores.homicides / 0.3),
                    shootingScore: Math.round(scores.shootings / 0.25),
                    pedestrianScore: Math.round(scores.pedestrianIncidents / 0.15),
                    breakAndEnterScore: Math.round(scores.breakAndEnters / 0.15),
                    fatalAccidentScore: Math.round(scores.fatalAccidents / 0.15)
                }
            };
        });

        return safetyAnalysis.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
        console.error('Error in safety analysis:', error);
        throw error;
    }
};

module.exports = {
    analyzeSafetyByNeighbourhood,
    calculateTrend,
    predictFutureIncidents
}; 