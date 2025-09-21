import json

def find_unique_timezones():
    with open('stations.json', 'r') as f:
        stations = json.load(f)

    timezones = set()

    for station in stations:
        timezone = station.get('timezone')
        if timezone is not None:
            timezones.add(timezone)

    return sorted(list(timezones))

if __name__ == "__main__":
    unique_timezones = find_unique_timezones()

    print(f"Found {len(unique_timezones)} unique timezones:")
    for timezone in unique_timezones:
        print(timezone)