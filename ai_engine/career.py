"""
Career Path Generator for DevLens AI.

Analyzes a developer's current skills and generates a personalized roadmap
to transition into a target role. Uses Gemini for rich recommendations and
falls back to rule-based templates when Gemini is unavailable.
"""

import json
import logging
from typing import Dict, Any, List, Optional

from app.services.cache import cache_get, cache_set

logger = logging.getLogger(__name__)

# Supported target roles
TARGET_ROLES = [
    "Full-Stack Engineer",
    "Backend Engineer",
    "Frontend Engineer",
    "DevOps / SRE",
    "ML / AI Engineer",
    "Systems Engineer",
    "Mobile Developer",
]

# Rule-based transition roadmaps for template fallback
_ROLE_ROADMAPS: Dict[str, Dict[str, Any]] = {
    "Full-Stack Engineer": {
        "required_skills": ["Backend", "Frontend", "DevOps"],
        "milestones": [
            {
                "title": "Master a backend framework",
                "description": "Build REST APIs with Python/FastAPI, Node.js/Express, or Go. "
                "Focus on authentication, database design, and error handling.",
                "suggested_repos": ["tiangolo/fastapi", "expressjs/express"],
                "priority": "high",
            },
            {
                "title": "Build interactive frontends",
                "description": "Learn React or Vue.js deeply. Build a project with state management, "
                "routing, and API integration.",
                "suggested_repos": ["facebook/react", "vuejs/vue"],
                "priority": "high",
            },
            {
                "title": "Learn deployment & CI/CD",
                "description": "Deploy applications with Docker and set up CI/CD pipelines. "
                "Understand cloud basics (AWS/GCP/Vercel).",
                "suggested_repos": ["docker/compose", "actions/runner"],
                "priority": "medium",
            },
            {
                "title": "Build a full-stack project",
                "description": "Create an end-to-end application from scratch — database, API, "
                "frontend, and deployment — to cement your skills.",
                "suggested_repos": [],
                "priority": "medium",
            },
        ],
        "timeline": "4-8 months",
    },
    "Backend Engineer": {
        "required_skills": ["Backend", "Systems", "DevOps"],
        "milestones": [
            {
                "title": "Learn a systems language",
                "description": "Pick up Python, Go, Rust, or Java for backend development. "
                "Focus on concurrency, I/O patterns, and type systems.",
                "suggested_repos": ["golang/go", "python/cpython"],
                "priority": "high",
            },
            {
                "title": "Master database design",
                "description": "Learn SQL (PostgreSQL), NoSQL (Redis, MongoDB), and ORM patterns. "
                "Practice schema design and query optimization.",
                "suggested_repos": ["postgres/postgres", "redis/redis"],
                "priority": "high",
            },
            {
                "title": "Build and deploy APIs",
                "description": "Create production-ready REST and/or GraphQL APIs with authentication, "
                "rate limiting, caching, and proper error handling.",
                "suggested_repos": ["tiangolo/fastapi", "graphql/graphql-spec"],
                "priority": "medium",
            },
            {
                "title": "Learn observability",
                "description": "Set up logging, metrics, and tracing. Understand monitoring tools "
                "like Prometheus, Grafana, and distributed tracing.",
                "suggested_repos": ["prometheus/prometheus", "grafana/grafana"],
                "priority": "low",
            },
        ],
        "timeline": "3-6 months",
    },
    "Frontend Engineer": {
        "required_skills": ["Frontend", "Open Source"],
        "milestones": [
            {
                "title": "Master modern JavaScript/TypeScript",
                "description": "Deep dive into ES2024+, TypeScript generics, async patterns, "
                "and the module ecosystem.",
                "suggested_repos": ["microsoft/TypeScript", "tc39/proposals"],
                "priority": "high",
            },
            {
                "title": "Learn a UI framework deeply",
                "description": "Master React (hooks, server components, suspense) or Vue 3 "
                "(composition API, reactivity). Build several projects.",
                "suggested_repos": ["facebook/react", "vuejs/core"],
                "priority": "high",
            },
            {
                "title": "Study design systems & accessibility",
                "description": "Learn component library patterns, responsive design, CSS-in-JS, "
                "and WCAG accessibility standards.",
                "suggested_repos": ["shadcn-ui/ui", "tailwindlabs/tailwindcss"],
                "priority": "medium",
            },
            {
                "title": "Optimize performance",
                "description": "Learn bundle optimization, lazy loading, SSR/SSG, and Core Web "
                "Vitals. Profile and fix real bottlenecks.",
                "suggested_repos": ["vercel/next.js", "vitejs/vite"],
                "priority": "medium",
            },
        ],
        "timeline": "3-5 months",
    },
    "DevOps / SRE": {
        "required_skills": ["DevOps", "Systems", "Backend"],
        "milestones": [
            {
                "title": "Master containerization",
                "description": "Learn Docker and Kubernetes. Understand images, networking, "
                "volumes, and orchestration patterns.",
                "suggested_repos": ["docker/compose", "kubernetes/kubernetes"],
                "priority": "high",
            },
            {
                "title": "Learn Infrastructure as Code",
                "description": "Use Terraform, Pulumi, or CloudFormation to define and manage "
                "infrastructure declaratively.",
                "suggested_repos": ["hashicorp/terraform", "pulumi/pulumi"],
                "priority": "high",
            },
            {
                "title": "Build CI/CD pipelines",
                "description": "Set up automated testing, building, and deployment with GitHub "
                "Actions, GitLab CI, or Jenkins.",
                "suggested_repos": ["actions/runner", "argoproj/argo-cd"],
                "priority": "medium",
            },
            {
                "title": "Learn monitoring & incident response",
                "description": "Set up alerting, SLOs/SLIs, on-call rotations, and post-mortem "
                "processes.",
                "suggested_repos": ["prometheus/prometheus", "grafana/grafana"],
                "priority": "medium",
            },
        ],
        "timeline": "4-7 months",
    },
    "ML / AI Engineer": {
        "required_skills": ["Data/ML", "Backend", "Systems"],
        "milestones": [
            {
                "title": "Master Python for data science",
                "description": "Learn NumPy, Pandas, and Matplotlib deeply. Understand data "
                "cleaning, exploration, and visualization workflows.",
                "suggested_repos": ["numpy/numpy", "pandas-dev/pandas"],
                "priority": "high",
            },
            {
                "title": "Learn ML fundamentals",
                "description": "Study supervised/unsupervised learning, model evaluation, and "
                "feature engineering using scikit-learn.",
                "suggested_repos": ["scikit-learn/scikit-learn"],
                "priority": "high",
            },
            {
                "title": "Deep learning & LLMs",
                "description": "Learn PyTorch or TensorFlow. Understand transformers, fine-tuning, "
                "and prompt engineering for LLMs.",
                "suggested_repos": ["pytorch/pytorch", "huggingface/transformers"],
                "priority": "medium",
            },
            {
                "title": "Deploy ML models",
                "description": "Learn MLOps: model serving (FastAPI, TorchServe), experiment "
                "tracking (MLflow), and model monitoring.",
                "suggested_repos": ["mlflow/mlflow", "tiangolo/fastapi"],
                "priority": "medium",
            },
        ],
        "timeline": "6-12 months",
    },
    "Systems Engineer": {
        "required_skills": ["Systems", "Backend", "DevOps"],
        "milestones": [
            {
                "title": "Learn C/C++ or Rust",
                "description": "Master memory management, pointers, ownership models, and "
                "low-level programming patterns.",
                "suggested_repos": ["rust-lang/rust", "llvm/llvm-project"],
                "priority": "high",
            },
            {
                "title": "Study operating system concepts",
                "description": "Understand processes, threads, memory management, file systems, "
                "and networking at the OS level.",
                "suggested_repos": ["torvalds/linux"],
                "priority": "high",
            },
            {
                "title": "Build systems-level projects",
                "description": "Write a simple database, HTTP server, or compiler to practice "
                "low-level design and performance optimization.",
                "suggested_repos": ["redis/redis", "nginx/nginx"],
                "priority": "medium",
            },
            {
                "title": "Learn distributed systems",
                "description": "Study consensus algorithms (Raft/Paxos), distributed databases, "
                "and fault tolerance patterns.",
                "suggested_repos": ["etcd-io/etcd", "cockroachdb/cockroach"],
                "priority": "low",
            },
        ],
        "timeline": "6-12 months",
    },
    "Mobile Developer": {
        "required_skills": ["Frontend", "Backend"],
        "milestones": [
            {
                "title": "Choose a mobile framework",
                "description": "Learn React Native (JavaScript) for cross-platform, or Swift/Kotlin "
                "for native iOS/Android development.",
                "suggested_repos": [
                    "facebook/react-native",
                    "nicklockwood/SwiftFormat",
                ],
                "priority": "high",
            },
            {
                "title": "Master mobile UI patterns",
                "description": "Learn navigation patterns, gesture handling, responsive layouts, "
                "and platform-specific design guidelines (HIG, Material).",
                "suggested_repos": [
                    "react-navigation/react-navigation",
                    "flutter/flutter",
                ],
                "priority": "high",
            },
            {
                "title": "Handle data & state",
                "description": "Implement local storage, API integration, push notifications, "
                "and offline-first architectures.",
                "suggested_repos": ["realm/realm-js", "apollographql/apollo-client"],
                "priority": "medium",
            },
            {
                "title": "Publish & distribute",
                "description": "Learn app store submission, code signing, OTA updates, and "
                "crash reporting tools.",
                "suggested_repos": ["fastlane/fastlane", "microsoft/appcenter"],
                "priority": "medium",
            },
        ],
        "timeline": "4-8 months",
    },
}


def _get_model():
    """Lazy-initialize the Gemini model."""
    global _model, _ai_available

    if "_model" not in globals():
        globals()["_model"] = None
        globals()["_ai_available"] = None

    model = globals().get("_model")
    ai_available = globals().get("_ai_available")

    if ai_available is False:
        return None
    if model is not None:
        return model

    try:
        from app.core.config import settings

        if not settings.GEMINI_API_KEY:
            logger.info(
                "No GEMINI_API_KEY — career path will use template fallback"
            )
            globals()["_ai_available"] = False
            return None

        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        new_model = genai.GenerativeModel("gemini-2.0-flash")
        globals()["_model"] = new_model
        globals()["_ai_available"] = True
        return new_model
    except Exception as e:
        logger.warning("Gemini unavailable for career path: %s", e)
        globals()["_ai_available"] = False
        return None


def _parse_json_response(text: str) -> Optional[Dict]:
    """Extract JSON from a Gemini response."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [line for line in lines if not line.strip().startswith("```")]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def generate_career_path(
    profile: Dict[str, Any], target_role: str
) -> Dict[str, Any]:
    """
    Generate a personalized career path from a developer's current profile
    to a target role.

    Args:
        profile: Dict with keys: username, name, top_languages, total_stars,
                 followers, repos, skills (optional list of {skill, value})
        target_role: One of TARGET_ROLES

    Returns:
        Dict with current_role, target_role, gap_analysis, milestones,
        timeline, and recommended_issues.
    """
    username = profile.get("username", "")
    cache_key = f"ai:career:{username}:{target_role.lower().replace(' ', '_')}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    current_role = _estimate_current_role(profile)

    model = _get_model()
    if model is None:
        result = _template_career_path(profile, current_role, target_role)
        return result

    try:
        langs = ", ".join(profile.get("top_languages", [])[:5])
        skills_str = ""
        if profile.get("skills"):
            skills_str = "\n".join(
                f"  - {s['skill']}: {s['value']}/100"
                for s in profile["skills"]
            )

        prompt = f"""You are an expert tech career advisor. Create a personalized career transition roadmap.

Current Developer Profile:
- Name: {profile.get('name', 'Unknown')} (@{username})
- Current Role Estimate: {current_role}
- Top Languages: {langs}
- Total Stars: {profile.get('total_stars', 0):,}
- Followers: {profile.get('followers', 0):,}
- Public Repos: {profile.get('repos', 0)}
{f"- Skills:{chr(10)}{skills_str}" if skills_str else ""}

Target Role: {target_role}

Create a detailed transition plan. Return ONLY valid JSON:
{{
  "gap_analysis": "3-4 sentence analysis of current skills vs target role requirements, identifying specific gaps",
  "milestones": [
    {{
      "title": "Milestone title",
      "description": "Detailed actionable description (2-3 sentences)",
      "suggested_repos": ["owner/repo1", "owner/repo2"],
      "priority": "high|medium|low"
    }}
  ],
  "timeline": "Estimated timeframe (e.g., '3-6 months')",
  "key_technologies": ["tech1", "tech2", "tech3"]
}}

Include 4-5 milestones ordered by priority. Be specific and actionable.
"""
        response = model.generate_content(prompt)
        parsed = _parse_json_response(response.text)

        if parsed:
            result = {
                "current_role": current_role,
                "target_role": target_role,
                "gap_analysis": parsed.get(
                    "gap_analysis",
                    f"Transitioning from {current_role} to {target_role} requires new skills.",
                ),
                "milestones": parsed.get("milestones", []),
                "timeline": parsed.get("timeline", "3-6 months"),
                "key_technologies": parsed.get("key_technologies", []),
            }
            await cache_set(cache_key, result, ttl=3600)
            return result

        return _template_career_path(profile, current_role, target_role)

    except Exception as e:
        logger.warning("Gemini career path failed: %s", e)
        return _template_career_path(profile, current_role, target_role)


def _estimate_current_role(profile: Dict[str, Any]) -> str:
    """Estimate the developer's current role from their language usage."""
    langs = [lang.lower() for lang in profile.get("top_languages", [])]
    skills = {
        s["skill"].lower(): s["value"]
        for s in profile.get("skills", [])
    }

    if any(lang in langs for lang in ["c", "c++", "rust", "assembly"]):
        return "Systems Engineer"
    if skills.get("data/ml", 0) > 60 or any(
        lang in langs for lang in ["jupyter notebook", "r"]
    ):
        return "Data / ML Engineer"
    if (
        skills.get("frontend", 0) > 60
        and skills.get("backend", 0) > 50
    ):
        return "Full-Stack Developer"
    if any(
        lang in langs
        for lang in ["typescript", "javascript", "vue", "html", "css"]
    ):
        return "Frontend Developer"
    if any(lang in langs for lang in ["python", "go", "java", "kotlin", "ruby"]):
        return "Backend Developer"
    if any(
        lang in langs for lang in ["swift", "kotlin", "dart"]
    ):
        return "Mobile Developer"
    return "Software Developer"


def _template_career_path(
    profile: Dict[str, Any], current_role: str, target_role: str
) -> Dict[str, Any]:
    """
    Generate a career path using pre-built rule-based roadmaps.
    Falls back to this when Gemini is unavailable.
    """
    roadmap = _ROLE_ROADMAPS.get(target_role, _ROLE_ROADMAPS["Full-Stack Engineer"])
    languages = profile.get("top_languages", [])
    name = profile.get("name", profile.get("username", "Developer"))

    # Build gap analysis from skill data
    skills = {
        s["skill"]: s["value"] for s in profile.get("skills", [])
    }
    required = roadmap.get("required_skills", [])
    weak_areas = [
        skill for skill in required if skills.get(skill, 30) < 50
    ]
    strong_areas = [
        skill for skill in required if skills.get(skill, 30) >= 50
    ]

    if weak_areas:
        gap_text = (
            f"{name} shows strength in {', '.join(strong_areas) if strong_areas else 'foundational development'}, "
            f"but transitioning to {target_role} requires growth in "
            f"{', '.join(weak_areas)}. "
            f"With {len(profile.get('top_languages', []))} active languages and "
            f"{profile.get('total_stars', 0):,} stars earned, "
            f"there is a solid foundation to build upon."
        )
    else:
        gap_text = (
            f"{name} already has strong fundamentals for {target_role} "
            f"with expertise in {', '.join(languages[:3])}. "
            f"The milestones below will help deepen specialization and fill "
            f"remaining gaps."
        )

    return {
        "current_role": current_role,
        "target_role": target_role,
        "gap_analysis": gap_text,
        "milestones": roadmap["milestones"],
        "timeline": roadmap["timeline"],
        "key_technologies": languages[:5],
    }
