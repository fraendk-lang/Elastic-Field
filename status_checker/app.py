import requests

def main():
    print("🚀 Deine Startumgebung ist bereit!")
    r = requests.get("https://api.github.com")
    if r.status_code == 200:
        print("✅ Verbindung zu GitHub erfolgreich!")
    else:
        print("❌ Fehler bei der Verbindung.")

if __name__ == "__main__":
    main()
