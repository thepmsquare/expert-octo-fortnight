from fastapi import FastAPI, Query
from fastapi.exceptions import HTTPException
from uvicorn import run
from enum import Enum
from dateutil import parser
from datetime import date, timedelta

app = FastAPI()


class OperationEnum(str, Enum):
    plus = "+"
    minus = "-"


class UnitEnum(str, Enum):
    days = "days"
    weeks = "weeks"


@app.get("/date_calc")
def date_calc(
    operation: OperationEnum,
    amount: int,
    unit: UnitEnum,
    from_date: str = Query(default="today"),
):
    try:
        if from_date == "today":
            date_object = date.today()
        else:
            try:
                date_object = parser.parse(from_date).date()
            except Exception as e:
                return HTTPException(
                    status_code=400, detail="Incorrect from_date. " + str(e)
                )
        if operation == "+":
            if unit == "days":
                new_date = date_object + timedelta(days=amount)
            elif unit == "weeks":
                new_date = date_object + timedelta(weeks=amount)
        if operation == "-":
            if unit == "days":
                new_date = date_object - timedelta(days=amount)
            elif unit == "weeks":
                new_date = date_object - timedelta(weeks=amount)
        return new_date.strftime("%d-%b-%Y")
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))


@app.get("/")
def read_root():
    return "go to /docs"


if __name__ == "__main__":
    run(app)
