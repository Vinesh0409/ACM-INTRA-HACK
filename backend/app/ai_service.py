import logging

import joblib
import pandas as pd

logger = logging.getLogger(__name__)

# These are loaded once, at import time, and reused for every predict()
# call -- joblib.load() is not called again after this.
try:
    model = joblib.load(
        "recommendation_model.pkl"
    )

    risk_encoder = joblib.load(
        "risk_encoder.pkl"
    )

    severity_encoder = joblib.load(
        "severity_encoder.pkl"
    )

    action_encoder = joblib.load(
        "action_encoder.pkl"
    )

    logger.info("AI recommendation model and encoders loaded successfully")

except Exception as e:
    logger.error("Failed to load recommendation model/encoders: %s", str(e))
    raise

# Column names must match what the model was trained on, so sklearn
# doesn't warn "X does not have valid feature names".
FEATURE_COLUMNS = ["risk", "vulnerable", "severity", "vuln_count", "priority"]


def _safe_encode(encoder, value, default=0):
    """Encode a label, falling back to `default` if it wasn't seen during training."""
    try:
        return encoder.transform([value])[0]
    except ValueError:
        logger.warning(
            "Unseen value '%s' for encoder %s, falling back to default=%s",
            value, encoder, default
        )
        return default


class AIRecommendationService:

    @staticmethod
    def predict(
        risk,
        vulnerable,
        severity,
        vuln_count,
        priority
    ):

        risk_value = _safe_encode(risk_encoder, risk)
        severity_value = _safe_encode(severity_encoder, severity)

        features = pd.DataFrame(
            [[risk_value, int(vulnerable), severity_value, vuln_count, priority]],
            columns=FEATURE_COLUMNS
        )

        try:
            prediction = model.predict(features)
            action = action_encoder.inverse_transform(prediction)[0]

            confidence_str = ""
            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(features)[0]
                confidence_str = f" {max(probabilities) * 100:.0f}%"

            logger.info(
                "Prediction risk=%s vulnerable=%s severity=%s priority=%s -> %s%s",
                risk, vulnerable, severity, priority, action, confidence_str
            )

            return f"{action}{confidence_str}"

        except Exception as e:
            logger.error("Prediction failed: %s", str(e))
            return "NO ACTION REQUIRED"
