import joblib

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
def predict_action(
    risk,
    vulnerable,
    severity,
    vuln_count,
    priority
):

    risk = (
        risk_encoder.transform(
            [risk]
        )[0]
    )

    severity = (
        severity_encoder.transform(
            [severity]
        )[0]
    )

    prediction = model.predict([
        [
            risk,
            vulnerable,
            severity,
            vuln_count,
            priority
        ]
    ])

    return (
        action_encoder
        .inverse_transform(
            prediction
        )[0]
    )
result = predict_action(
    risk="HIGH",
    vulnerable=1,
    severity="HIGH",
    vuln_count=5,
    priority=150
)

print(result)