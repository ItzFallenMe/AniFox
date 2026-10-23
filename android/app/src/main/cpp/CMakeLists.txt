cmake_minimum_required(VERSION 3.22.1)

project(anifox_discord CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# The Social SDK arrives as a prefab-enabled AAR in app/libs.
find_package(discord_partner_sdk REQUIRED CONFIG)

add_library(anifox_discord SHARED discord_presence.cpp)

target_link_libraries(
  anifox_discord
  PRIVATE
    discord_partner_sdk::discord_partner_sdk
    android
    log
)
