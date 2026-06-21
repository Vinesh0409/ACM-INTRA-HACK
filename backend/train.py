import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

data = pd.read_csv(
    "dataset/recommendations.csv"
)

print(data.head())

print("\nRows:")
print(len(data))

X = data[
    [
        "risk",
        "vulnerable",
        "severity",
        "vuln_count",
        "priority"
    ]
]

y = data["action"]

risk_encoder = LabelEncoder()

severity_encoder = LabelEncoder()

action_encoder = LabelEncoder()

X["risk"] = (
    risk_encoder.fit_transform(
        X["risk"]
    )
)

X["severity"] = (
    severity_encoder.fit_transform(
        X["severity"]
    )
)

y = (
    action_encoder.fit_transform(
        y
    )
)
X_train, X_test, y_train, y_test = (
    train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )
)
model = RandomForestClassifier()

model.fit(
    X_train,
    y_train
)
accuracy = model.score(
    X_test,
    y_test
)

print(
    "Accuracy:",
    accuracy
)

joblib.dump(
    model,
    "recommendation_model.pkl"
)
joblib.dump(
    risk_encoder,
    "risk_encoder.pkl"
)

joblib.dump(
    severity_encoder,
    "severity_encoder.pkl"
)

joblib.dump(
    action_encoder,
    "action_encoder.pkl"
)